# Database Backup System

## Overview
Automatic database backup system for Indian Wonderer application.

## Features
- ✅ Daily automatic backups at 2:00 AM
- ✅ Backups stored in `backend/backups/` directory
- ✅ Automatic cleanup - keeps last 10 backups
- ✅ Deletes backups older than 30 days
- ✅ Timestamped backup files

## Setup Instructions

### Option 1: Automatic Setup (Recommended)
1. Right-click `setup_auto_backup.bat`
2. Select "Run as Administrator"
3. Follow the prompts

### Option 2: Manual Backup
Run `backup_database.bat` anytime to create a manual backup.

### Option 3: Manual Task Scheduler Setup
1. Open Task Scheduler (Win + R, type: taskschd.msc)
2. Click "Create Basic Task"
3. Name: IndianWonderer_DailyBackup
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
6. Program: `C:\xampp\htdocs\fu\backend\backup_database.bat`

## Backup File Format
```
indian_wonderer_base_backup_YYYYMMDD_HHMMSS.sql
Example: indian_wonderer_base_backup_20260129_020000.sql
```

## Restore Database
To restore from a backup:
```bash
mysql -u root indian_wonderer_base < backups/backup_file.sql
```

Or using PowerShell:
```powershell
Get-Content backups\backup_file.sql | C:\xampp\mysql\bin\mysql.exe -u root indian_wonderer_base
```

## Configuration
Edit `backup_database.bat` to modify:
- `DB_NAME` - Database name
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password (if any)
- `BACKUP_DIR` - Backup storage location

## Backup Retention Policy
- **Maximum backups kept**: 10 most recent
- **Maximum age**: 30 days
- **Frequency**: Daily at 2:00 AM

## Verify Backup Schedule
1. Open Task Scheduler
2. Find "IndianWonderer_DailyBackup"
3. Check "Last Run Time" and "Next Run Time"

## Troubleshooting

### Backup not running?
- Verify MySQL is running
- Check backup_database.bat has correct paths
- Ensure Task Scheduler service is running
- Check Windows Event Viewer for errors

### Manual test:
```cmd
cd C:\xampp\htdocs\fu\backend
backup_database.bat
```

Check the `backups/` folder for the newly created file.
