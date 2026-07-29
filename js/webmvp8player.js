//	This webmplayer is developed to show a live stream in webm/vp8 format
//	received from a websocket. It relies on dixie-dc.js which wraps dixie.js, a webm/vp8
//	decoder developed by Dominik Homberger (dominik.homberger@gmail.com).
//	The vpximg2canvas method is adopted directly from vpxdec.html, 
//	the demo page created by Dominik 
//
//	In order to handle multiple live views on one web page, dixie.js 
//	has to be wrapped in an object in the following form:
//	var Dixie = function(){
//		dixie script;
//		this.liveView = function(){}
//		this.pushData = function(){}
//	}
//
//	<script type="text/javascript">		
//		var canvas1 = document.getElementById("vpximage1");		
//		var ws_url1 = "ws://127.0.0.1:8082/";	
//		var webmPlayer1 = new WebmPlayer(ws_url1, canvas1, showInfo1);			
//		//callback function
//		function showInfo1(timecode, frames, render, fps){
//			var info1 = document.getElementById("info1");	
//			info1.innerHTML = "frames:" + frames + "&nbsp;render(ms):" + render + "&nbsp;fps:" + fps; 
//		}				
//	</script>
//
// 	Dashan Chang (dashanchang@hotmail.com)
// 
//	Date: 07/28/2026
//
//-----------------------------------------------------------------------------
var WebmPlayer = function(ws_url, canvas, showInfo){
	var context;
	var output;
	var outputData;
	var R, G, B;
	var pos, outputData_pos;
	var firsttime=true;
	var plane;
	var planeY_off, planeU_off, planeV_off;
	var stride_UV_off, stride_Y_h_off, stride_UV_h_off, stride_RGBA_off;
	
	//-------------------------------------------------------------------------
	this.vpximg2canvas = function(img) {
		if (img.w == 0 || img.h == 0) return;
		if (firsttime) {
			//canvas = document.getElementById("vpximage"),
			context = canvas.getContext("2d");
			
			yuvheight	= img.h;
			yuvwidth	= img.w;
			height		= img.d_h;
			width		= img.d_w;
			
			//Draw YUV
			canvas.height=height;
			canvas.width=width;

			output = context.createImageData(canvas.width, canvas.height);
			outputData = output.data;
			planeY_off=img.planes_off[0];
			planeU_off=img.planes_off[1];
			planeV_off=img.planes_off[2];
			firsttime=false;
		}
		plane=img.planes[0];
		
		for (var h=0;h<height;h++) {
			stride_Y_h_off = (yuvwidth)*h
			stride_UV_h_off = (yuvwidth>>1)*(h>>1)
			stride_RGBA_off = (width<<2)*h
			for (var w=0;w<width;w++) {
				Y = plane[planeY_off+ w+stride_Y_h_off];
				stride_UV_off = (w>>1)+stride_UV_h_off;
				U = (plane[planeU_off+ stride_UV_off]) - 128;
				V = (plane[planeV_off+ stride_UV_off]) - 128;
				//alert(Y+' '+U+' '+V+' ');
				R =  (Y + 1.371*V);
				G =  (Y - 0.698*V - 0.336*U);
				B =  (Y + 1.732*U);

				outputData_pos = (w<<2)+stride_RGBA_off;
				outputData[0+outputData_pos] = R;
				outputData[1+outputData_pos] = G;
				outputData[2+outputData_pos] = B;
				outputData[3+outputData_pos] = 255;
			};			
		}		
		context.putImageData(output, 0, 0);
	}
	
	//-----------------------------------------------------------------------------
	this.startStreaming = function(ws_url, dixie) {
		var connection = new WebSocket( ws_url );
		connection.binaryType = 'arraybuffer';
		//-------------------------------------------------------------------------
		connection.onopen = function() {
			console.log('ws connected');
		}
		//-------------------------------------------------------------------------
		connection.onerror = function(error){
			console.log("error:" + error);
		}
		
		var bytehexstr = "";
		var hdremitted = false;
		//-------------------------------------------------------------------------
		connection.onmessage = function(e) {
			emitData(e);
		}
		
		//-------------------------------------------------------------------------
		function hexStringToBytes(str) {
			if (!str) {
				return new Uint8Array();
			}
			var a = [];
			for (var i = 0, len = str.length; i < len; i+=2) {
				a.push(parseInt(str.substr(i,2),16));
			}
			return new Uint8Array(a);
		}
		
		//------------------------------------------------------------------------
		function bytesToHexString(uInt8Array){
			var str = "";
			for(var i=0; i< uInt8Array.length; i++)	{
				var b = uInt8Array[i].toString(16);
				if (b.length == 1) b = '0' + b;
				str += b;
			}
			return str;
		}	

		//-------------------------------------------------------------------------
		function emitData(evt){
			const webmheader = "1a45dfa3";
			const clusterhdr = "1f43b675";
			
			var bytes = new Uint8Array(evt.data);		
			var str = bytesToHexString(bytes);
			bytehexstr += str;

			var strs = bytehexstr.split(clusterhdr);
					
			if (! hdremitted ){
				if (strs.length <= 2) return;
				var uInt8Array = hexStringToBytes(clusterhdr + strs[1]);	//at least one cluster has to be appended to the webm header.				
				var result = dixie.startLiveFromCluster(uInt8Array);		//initialize live stream starting from a cluster. This eliminates the need to Webm container header at the stream server side.
				if (result == false) {
					bytehexstr = "";
					return;
				}			
				hdremitted = true;					
				for(var i=2; i<strs.length-1; i++){
					uInt8Array = hexStringToBytes(clusterhdr + strs[i]);
					dixie.pushData(uInt8Array);
				}
				bytehexstr = strs[strs.length-1];
				return;					
			}
			
			for(var i=0; i<strs.length-1; i++){
				uInt8Array = hexStringToBytes(clusterhdr + strs[i]);
				dixie.pushData(uInt8Array);
			}
			bytehexstr = strs[strs.length-1];	
		}		
	}
		
	//-----------------------------------------------------------------------------
	this.play = function(ws_url, showInfo){
		var dixie = new Dixie();
		dixie.player = this;
		dixie.player.showInfo = showInfo;
		dixie.segments = [];
		this.startStreaming(ws_url, dixie);
	}
	
	// start to play the live stream received from a websocket
	// showInfo is a callback to show the progress info of the stream
	this.play(ws_url, showInfo);
}


