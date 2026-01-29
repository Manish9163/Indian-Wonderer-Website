@echo off
REM Database Backup Script for Indian Wonderer
REM This script creates automatic backups of the database

SET DB_NAME=indian_wonderer_base
SET DB_USER=root
SET DB_PASSWORD=
SET BACKUP_DIR=C:\xampp\htdocs\fu\backend\backups
SET MYSQL_BIN=C:\xampp\mysql\bin

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Generate filename with date and time
SET TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
SET TIMESTAMP=%TIMESTAMP: =0%
SET BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_backup_%TIMESTAMP%.sql

REM Perform the backup
echo Creating database backup...
"%MYSQL_BIN%\mysqldump.exe" -u %DB_USER% %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo Backup successful: %BACKUP_FILE%
    
    REM Delete backups older than 30 days
    forfiles /P "%BACKUP_DIR%" /S /M *.sql /D -30 /C "cmd /c del @path" 2>nul
    
    REM Keep only the last 10 backups
    for /f "skip=10 delims=" %%i in ('dir /b /o-d "%BACKUP_DIR%\*.sql"') do (
        del "%BACKUP_DIR%\%%i"
    )
) else (
    echo Backup failed!
)

exit /b %ERRORLEVEL%
