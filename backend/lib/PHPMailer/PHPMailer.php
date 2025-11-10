<?php

namespace PHPMailer\PHPMailer;

class PHPMailer
{
    public $From = '';
    public $FromName = '';
    public $Subject = '';
    public $Body = '';
    public $AltBody = '';
    public $CharSet = 'UTF-8';
    public $ContentType = 'text/html';
    public $Encoding = '8bit';
    public $ErrorInfo = '';
    public $Mailer = 'smtp';
    public $Host = '';
    public $Port = 587;
    public $SMTPAuth = false;
    public $Username = '';
    public $Password = '';
    public $SMTPSecure = 'tls';
    public $SMTPDebug = 0;
    public $Timeout = 30;
    public $isHTML = true;

    private $to = [];
    private $cc = [];
    private $bcc = [];
    private $replyTo = [];
    private $attachments = [];
    private $smtpConnection = null;

    public function __construct($exceptions = false) {}

    public function setFrom($address, $name = '', $auto = true)
    {
        $this->From = $address;
        $this->FromName = $name;
        return true;
    }

    public function addAddress($address, $name = '')
    {
        $this->to[] = ['email' => $address, 'name' => $name];
        return true;
    }

    public function addCC($address, $name = '')
    {
        $this->cc[] = ['email' => $address, 'name' => $name];
        return true;
    }

    public function addBCC($address, $name = '')
    {
        $this->bcc[] = ['email' => $address, 'name' => $name];
        return true;
    }

    public function addReplyTo($address, $name = '')
    {
        $this->replyTo[] = ['email' => $address, 'name' => $name];
        return true;
    }

    public function addAttachment($path, $name = '')
    {
        if (file_exists($path)) {
            $this->attachments[] = ['path' => $path, 'name' => $name];
            return true;
        }
        return false;
    }

    public function isHTML($ishtml = true)
    {
        $this->isHTML = $ishtml;
        if ($ishtml) {
            $this->ContentType = 'text/html';
        } else {
            $this->ContentType = 'text/plain';
        }
    }

    public function send()
    {
        try {
            if (empty($this->to)) {
                $this->ErrorInfo = 'No recipients specified';
                return false;
            }

            if ($this->Mailer === 'smtp') {
                return $this->smtpSend();
            } else {
                return $this->mailSend();
            }
        } catch (\Exception $e) {
            $this->ErrorInfo = $e->getMessage();
            return false;
        }
    }

    private function smtpSend()
    {
        $socket = @fsockopen(
            ($this->SMTPSecure === 'ssl' ? 'ssl://' : '') . $this->Host,
            $this->Port,
            $errno,
            $errstr,
            $this->Timeout
        );

        if (!$socket) {
            $this->ErrorInfo = "Could not connect to SMTP host: $errstr ($errno)";
            return false;
        }

        stream_set_timeout($socket, $this->Timeout);
        
        $this->getServerResponse($socket);

        $hostname = $_SERVER['SERVER_NAME'] ?? $_SERVER['HOSTNAME'] ?? 'localhost';
        fputs($socket, "EHLO {$hostname}\r\n");
        $this->getServerResponse($socket);

        if ($this->SMTPSecure === 'tls') {
            fputs($socket, "STARTTLS\r\n");
            $this->getServerResponse($socket);
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($socket, "EHLO {$hostname}\r\n");
            $this->getServerResponse($socket);
        }

        if ($this->SMTPAuth) {
            fputs($socket, "AUTH LOGIN\r\n");
            $this->getServerResponse($socket);
            fputs($socket, base64_encode($this->Username) . "\r\n");
            $this->getServerResponse($socket);
            fputs($socket, base64_encode($this->Password) . "\r\n");
            $response = $this->getServerResponse($socket);
            
            if (strpos($response, '235') === false) {
                $this->ErrorInfo = 'SMTP Authentication failed: ' . $response;
                fclose($socket);
                return false;
            }
        }

        fputs($socket, "MAIL FROM: <{$this->From}>\r\n");
        $this->getServerResponse($socket);

        foreach ($this->to as $recipient) {
            fputs($socket, "RCPT TO: <{$recipient['email']}>\r\n");
            $this->getServerResponse($socket);
        }

        fputs($socket, "DATA\r\n");
        $this->getServerResponse($socket);

        $headers = $this->createHeader();
        fputs($socket, $headers);

        fputs($socket, "\r\n" . $this->Body . "\r\n");
        fputs($socket, ".\r\n");
        $this->getServerResponse($socket);

        fputs($socket, "QUIT\r\n");
        fclose($socket);

        return true;
    }

    private function mailSend()
    {
        $to = [];
        foreach ($this->to as $recipient) {
            $to[] = $recipient['name'] ? "{$recipient['name']} <{$recipient['email']}>" : $recipient['email'];
        }
        $toStr = implode(', ', $to);

        $headers = $this->createHeader();
        
        return mail($toStr, $this->Subject, $this->Body, $headers);
    }

    private function createHeader()
    {
        $headers = [];
        $headers[] = "From: {$this->FromName} <{$this->From}>";
        $headers[] = "Reply-To: {$this->From}";
        $headers[] = "MIME-Version: 1.0";
        $headers[] = "Content-Type: {$this->ContentType}; charset={$this->CharSet}";
        $headers[] = "Content-Transfer-Encoding: {$this->Encoding}";
        $headers[] = "X-Mailer: PHPMailer";
        $headers[] = "Subject: {$this->Subject}";
        
        foreach ($this->to as $recipient) {
            $toEmail = $recipient['name'] ? "{$recipient['name']} <{$recipient['email']}>" : $recipient['email'];
            $headers[] = "To: {$toEmail}";
        }

        return implode("\r\n", $headers) . "\r\n";
    }

    private function getServerResponse($socket)
    {
        $response = '';
        while ($str = fgets($socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) === ' ') {
                break;
            }
        }
        
        if ($this->SMTPDebug >= 2) {
            echo "SERVER: $response\n";
        }
        
        return $response;
    }

    public function clearAddresses()
    {
        $this->to = [];
    }

    public function clearCCs()
    {
        $this->cc = [];
    }

    public function clearBCCs()
    {
        $this->bcc = [];
    }

    public function clearReplyTos()
    {
        $this->replyTo = [];
    }

    public function clearAllRecipients()
    {
        $this->to = [];
        $this->cc = [];
        $this->bcc = [];
    }

    public function clearAttachments()
    {
        $this->attachments = [];
    }
}
