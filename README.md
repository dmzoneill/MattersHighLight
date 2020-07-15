# MattersHighLight

Get started:

```
git clone https://github.com/dmzoneill/MattersHighLight.git
```
<br>
Modify manifest.json (to provide your own sounds) if you wish:

```
vim manifest.json
```
<br>
In order to workaround policy restrictions on background sounds you need to launch chrome with:


```
/opt/google/chrome/chrome --autoplay-policy=no-user-gesture-required --disable-features=PreloadMediaEngagementData,AutoplayIgnoreWebAudio,MediaEngagementBypassAutoplayPolicies
```

<br>
Creating a seperate window with matters most icon

```
cat HighMonMattersMost.desktop 
[Desktop Entry]
Encoding=UTF-8
Version=1.0
Type=Application
Terminal=false
Exec=/opt/google/chrome/mattersmost --autoplay-policy=no-user-gesture-required --disable-features=PreloadMediaEngagementData,AutoplayIgnoreWebAudio,MediaEngagementBypassAutoplayPolicies --new-window --app=https://chat.canonical.com --user-data-dir="/home/dmzoneill/src/bsMMhighmon/userdir" --class="Chr2"
Name=Highmon MattersMost
Icon=/opt/Mattermost/mm.png
StartupWMClass=Chr2
StartupNotify=true
Categories=Network;WebBrowser;
```

<br>

Prep the icon, serpate binary and copy the desktop file into place
```
sudo cp /opt/google/chrome/google-chrome /opt/google/chrome/mattersmost
sudo inkscape -z -w 128 -h 128 /opt/Mattermost/icon.svg -e /opt/Mattermost/mm.png
cp HighMonMattersMost.desktop  ~/.local/share/applications/

```

<br>
go to:

```
extensions > load plugin > select to plugin folder
```
<br>
Visit your matters most website:

```
click settings, provide MM auth token and pagerduty key
```

<br>
<img src='2.png'>

<br>
<img src='1.png'>
