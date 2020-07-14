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
