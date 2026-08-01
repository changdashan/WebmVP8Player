# WebmVP8Player - A JavaScript-Based Live-Streaming WebM/VP8 Video Player

## Features

- Pure JavaScript WebM/VP8 decoder
- Live WebM streaming over WebSocket
- No browser plugins or native code required
- Supports multiple independent player instances on the same page
- Reconstructs a minimal WebM header from key frames, eliminating the need for a cached header on the streaming server

**WebmVP8Player** is a JavaScript-based live-streaming Webm/VP8 video player. It is based on **vp8-webm-javascript-decoder** by Dominik Homberger and runs in all modern web browsers.

The original `dixie.js` was designed to decode complete WebM files and does not intended for live video streaming. It also runs as a global object within the browser. To enable live streaming, I wrapped the decoder in a JavaScript class named `Dixie` and added several methods, `startLiveFromCluster()`, `startLive()` and `pushData()`, to allow it to process streaming data incrementally.

On top of that, I developed `WebmVP8Player`, which adds WebSocket support and internally instantiates a `Dixie` object. This design allows multiple `WebmVP8Player` instances to run independently on the same page, making it possible to display live streams from multiple cameras simultaneously.

Getting started is as simple as the following example.

## Usage

The following HTML example demonstrates how to use **WebmVP8Player**. When you open the page in a modern browser, the player connects to the WebSocket server and begins receiving a WebM/VP8 video stream.

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Live Streaming WebM/VP8</title>
        <script type="text/javascript" src="js/dixie-dc.js"></script>
        <script type="text/javascript" src="js/webmplayer.js"></script>
    </head>

    <body>
        <div id="viewPort1">
            <canvas id="vpximage1" style="border:1px solid black"></canvas>
            <div id="info1" style="font-size:18px"></div>
        </div>

        <script type="text/javascript">
            var canvas1 = document.getElementById("vpximage1");
            var ws_url1 = "ws://127.0.0.1:8082/";
            var webmPlayer1 = new WebmPlayer(ws_url1, canvas1, showInfo1);

            // Callback
            function showInfo1(timecode, frames, render, fps) {
                var info1 = document.getElementById("info1");
                info1.innerHTML =
                    "Frames: <label style='display:inline-block;width:50px'>" + frames +
                    "</label>Render (ms): <label style='display:inline-block;width:40px'>" + render +
                    "</label>FPS: <label style='display:inline-block;width:40px'>" + fps +
                    "</label>";
            }
        </script>
    </body>
</html>
```

## Streaming a Webcam with FFmpeg

To test **WebmVP8Player**, you can use FFmpeg to capture video from your webcam and stream it in WebM/VP8 format:

```bash
ffmpeg -f dshow -i video="[Your Webcam Name]" -f webm -r 20 -s 800x450 -c:v libvpx -b:v 1M -g 10 http://127.0.0.1:8081/password
```

This command captures video from your local webcam and streams it to the specified HTTP endpoint in WebM/VP8 format.

You can download FFmpeg from:

https://ffmpeg.org/download.html

### Finding Your Webcam Name

To list the available video and audio devices, run:

```bash
ffmpeg -list_devices true -f dshow -i dummy
```

In the output, look for the entries labeled **(video)** and **(audio)**. The names enclosed in double quotes are the device names. For example:

```text
[in#0 @ 000001c2c226f1c0] "Integrated Webcam" (video)
[in#0 @ 000001c2c226f1c0] "Microphone (Realtek(R) Audio)" (audio)
```

## HTTP/WebSocket Streaming Server

FFmpeg sends the WebM/VP8 stream to an HTTP endpoint, whereas WebmVP8Player receives the stream over a WebSocket connection. An intermediate relay server is therefore required to receive the HTTP stream from FFmpeg and forward it to one or more connected WebSocket clients.

The `websocket-relay.js` service performs this task. `websocket-relay.js` is an HTTP/WebSocket relay server included with **jsmpeg**, originally written by Dominic Szablewski. This project includes it unchanged for demonstration purposes.

The relay server is a Node.js application. Before running it, make sure Node.js is installed on your computer.

To start the server, open a command prompt, navigate to the `http-ws-stream-server` directory, and run:

```bash
start-server.bat
```

## Test Instructions

1. Download and install NodeJS and FFmpeg on your computer and add the full path of them to the path environment variable.
2. Download or Git Clone this project to a folder.
3. Open two Windows Command consoles, one for running the http/websocket server (start-sever.bat) and one for running FFmpeg to stream your webcam
4. Right click the Demo.html file and open it in a browser.   

## Notes

In the notes for **LiveStreamWebmPlayer**, I wrote:

> "Ideally, the decoder would be able to reconstruct the required container information from a key frame or from the stream itself, eliminating the need for the cached WebM header on the stream server side."

The current implementation of **WebmVP8Player** achieves this goal. The stream server now serves as a pure binary data tunnel between the remote camera and the browser-based player.

The **Dixie** object has been enhanced to parse key frame information starting from any cluster chunk and construct a minimal WebM header.

Contributions, bug reports, suggestions, and discussions are all welcome.


