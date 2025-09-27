@echo off
REM === Change these variables below ===
set USER=root
set PASSWORD=TEchno@123
set DATABASE=test23
set BACKUP_FILE=C:\Clients\Tabish Bhai\wORKING ON IT\Dezine Dot final\backup_23-09-2025.sql

REM === Path to mysql.exe (don't use quotes here) ===
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 9.2\bin\mysql.exe

echo Creating database %DATABASE% if it does not exist...
"%MYSQL_PATH%" -u %USER% -p%PASSWORD% -e "CREATE DATABASE IF NOT EXISTS %DATABASE%;"

echo Restoring database %DATABASE% from %BACKUP_FILE%...
"%MYSQL_PATH%" -u %USER% -p%PASSWORD% %DATABASE% < "%BACKUP_FILE%" > restore_log.txt 2>&1

IF %ERRORLEVEL% EQU 0 (
    echo Restore completed successfully!
) ELSE (
    echo Restore failed! Please check restore_log.txt for details.
)

pause
