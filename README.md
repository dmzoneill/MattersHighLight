# MattersHighLight

In orderr to workaround policy restrictions on background sounds you need to launch chrome with

Get started:

```
git clone https://github.com/dmzoneill/MattersHighLight.git
```
<br>
Modify manifest.json (to provide your own sounds) if you wish
<br>
```
vim manifest.json
```
<br>
open chrome

```
/opt/google/chrome/chrome --autoplay-policy=no-user-gesture-required --disable-features=PreloadMediaEngagementData,AutoplayIgnoreWebAudio,MediaEngagementBypassAutoplayPolicies
```
<br>
go to

```
extensions > load plugin > select to plugin folder
```
<br>
Visit your matters most website

```
click settings, provide MM auth token and pagerduty key
```
<br>
<br>
<br>
![alt text](https://raw.githubusercontent.com/dmzoneill/MattersHighLight/master/2.png)

<br>
![alt text](https://raw.githubusercontent.com/dmzoneill/MattersHighLight/master/1.png)