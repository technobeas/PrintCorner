@echo off
set USER=root
set PASSWORD=TEchno@123
set DATABASE=shop
set BACKUP_PATH=C:\Tabish Bhai\Code\Code\Code\db backup\backup_%DATE%.sql

"C:\Program Files\MySQL\MySQL Server 9.2\bin\mysqldump.exe" -u %USER% -p%PASSWORD% %DATABASE% > "%BACKUP_PATH%"

echo Backup completed successfully!
pause
