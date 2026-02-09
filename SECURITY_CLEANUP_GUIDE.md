# Security Cleanup Guide - XMRig Miner Removal

## ✅ Crontab Check
आपका crontab साफ है - कोई suspicious entry नहीं है।

## 🔍 Additional Security Checks

### 1. Check for XMRig Process
```bash
# Check if XMRig is running
ps aux | grep -i xmrig
ps aux | grep -i moneroocean

# Kill if found
pkill -9 -f xmrig
pkill -9 -f moneroocean
```

### 2. Remove Malicious Files
```bash
# Remove XMRig directory
rm -rf /root/moneroocean

# Check for other suspicious locations
find /root -name "*xmrig*" -o -name "*moneroocean*" 2>/dev/null
find /tmp -name "*xmrig*" -o -name "*moneroocean*" 2>/dev/null
find /var/tmp -name "*xmrig*" -o -name "*moneroocean*" 2>/dev/null
```

### 3. Check System Cron Directories
```bash
# Check system-wide cron jobs
ls -la /etc/cron.d/
ls -la /etc/cron.daily/
ls -la /etc/cron.hourly/
ls -la /etc/cron.weekly/
ls -la /etc/cron.monthly/

# Check for suspicious entries
cat /etc/cron.d/* 2>/dev/null | grep -i xmrig
cat /etc/cron.d/* 2>/dev/null | grep -i moneroocean
```

### 4. Check Systemd Services
```bash
# Check for suspicious systemd services
systemctl list-units --type=service | grep -i xmrig
systemctl list-units --type=service | grep -i moneroocean

# Check service files
find /etc/systemd/system -name "*xmrig*" -o -name "*moneroocean*" 2>/dev/null
```

### 5. Check Shell Configuration Files
```bash
# Check for malicious code in shell configs
grep -i xmrig /root/.bashrc /root/.bash_profile /root/.profile 2>/dev/null
grep -i moneroocean /root/.bashrc /root/.bash_profile /root/.profile 2>/dev/null
```

### 6. Check Network Connections
```bash
# Check for suspicious network connections
netstat -tulpn | grep -i xmrig
ss -tulpn | grep -i xmrig

# Check for connections to mining pools
netstat -tulpn | grep -E "monero|mining|pool"
```

### 7. Check Startup Scripts
```bash
# Check rc.local
cat /etc/rc.local

# Check init.d
ls -la /etc/init.d/ | grep -i xmrig
```

### 8. Check for Hidden Processes
```bash
# Check all processes
ps auxf | grep -v grep

# Check for processes using high CPU
top -b -n 1 | head -20
```

## 🛡️ Prevention Steps

### 1. Clean npm Installation
```bash
cd /path/to/your/project
rm -rf node_modules package-lock.json
npm install
npm audit
```

### 2. Verify No Malicious Packages
```bash
# Check if malicious packages are still installed
npm list fs path i 2>/dev/null

# Should show: empty or "npm ERR! code ELSPROBLEMS"
```

### 3. Monitor System
```bash
# Monitor CPU usage
htop

# Monitor network connections
iftop

# Check disk usage
df -h
```

### 4. Set Up Monitoring
```bash
# Add to crontab for monitoring
crontab -e
# Add this line:
# */5 * * * * ps aux | grep -i xmrig | grep -v grep && echo "ALERT: XMRig detected!" | mail -s "Security Alert" your-email@example.com
```

## ✅ Verification

After cleanup, verify:
1. No XMRig processes running
2. No suspicious cron jobs
3. No malicious files in /root/moneroocean
4. package.json is clean (no fs, path, i packages)
5. Normal CPU usage

## 📝 Notes

- The malicious packages (`fs`, `path`, `i`) have been removed from package.json
- These packages were installing XMRig during `npm install`
- Now that they're removed, the virus won't come back after fresh installs

