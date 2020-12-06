import React, { useRef, useEffect } from 'react';
import io from 'socket.io-client';

var pc, textref;

const App= () => {

  const localVideoref = useRef();
  const remoteVideoref = useRef();
  var socket = null;
  var candidates = [];

  useEffect(() => {

    socket = io(
      '/webrtcPeer',
      {
        path: '/webrtc',
        query: {}
      }
    )

    socket.on('connection-success', success => {
      console.log(success)
    })

    socket.on('offerOrAnswer', (sdp) => {
      textref.value = JSON.stringify(sdp)

      pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })

    socket.on('candidate', (candidate) => {
      // candidates = [...candidates, candidate]
      pc.addIceCandidate(new RTCIceCandidate(candidate))
    })

    const pc_config = {
      "iceServers": [
        // {
        //   urls: 'stun:[STUN_IP]:[PORT]',
        //   'credentials': '[YOR CREDENTIALS]',
        //   'username': '[USERNAME]'
        // },
        {
          urls : 'stun:stun.l.google.com:19302'
        }
      ]
    }

    pc = new RTCPeerConnection(pc_config)

    pc.onicecandidate = (e) => {
      if (e.candidate) { 
        sendToPeer('candidate', e.candidate)
      }
      // console.log(JSON.stringify(e.candidate)) // 쓰는게 국룰
    }

    pc.oniceconnectionstatechange = (e) => {
      console.log(e)
    }

    pc.ontrack = (e) => {
      remoteVideoref.current.srcObject = e.streams[0]
    }

    const constraints = { audio: false, video: true }

    const success = (stream) => {
      window.localStream = stream
      localVideoref.current.srcObject = stream
      pc.addStream(stream)
    }

    const failure = (e) => {
      console.log('getUserMedia Error: ', e)
    }

    // 강제 처리
    navigator.mediaDevices.getUserMedia(constraints)
      .then(success)
      .catch(failure)
    // 비동기 처리
    // (async () => {
    //   const steam = await navigator.mediaDevices.getUserMedia(constraints)
    //   success(steam)
    // })().catch(failure)
  }, []);

  const sendToPeer = (messageType, payload) => {
    socket.emit(messageType, {
      socketID: socket.id,
      payload
    })
  }

  const createOffer = () => {
    console.log('Offer')
    pc.createOffer({ offerToReceiveAudio: 1 })
      .then(sdp => {
        // console.log(JSON.stringify(sdp))
        pc.setLocalDescription(sdp)

        sendToPeer('offerOrAnswer', sdp)
      })
  }

  // const setRemoteDescription = () => {
  //   // retrieve and parse the SDP copied from the remote peer
  //   const desc = JSON.parse(textref.value)

  //   // set sdp as remote description
  //   pc.setRemoteDescription(new RTCSessionDescription(desc))
  // }

  const createAnswer = () => {
    console.log('Answer')
    pc.createAnswer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        // console.log(JSON.stringify(sdp))

        // set answer sdp as local description
        pc.setLocalDescription(sdp)

        sendToPeer('offerOrAnswer', sdp)
    })
  }

  // const addCandidate = () => {
  //   // retrieve and parse the Candidate copied from the remote peer
  //   // const candidate = JSON.parse(textref.value)
  //   // console.log('Adding candidate:', candidate)

  //   // add the candidate to the peer connection
  //   // pc.addIceCandidate(new RTCIceCandidate(candidate))

  //   candidates.forEach(candidate => {
  //     console.log(JSON.stringify(candidate))
  //     pc.addIceCandidate(new RTCIceCandidate(candidate))
  //   });
  // }

  return (
    <div>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: 'black'
        }}
        ref={localVideoref}
        autoPlay></video>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: 'black'
        }}
        ref={remoteVideoref}
        autoPlay></video>
      <br />
      <button onClick={createOffer}>Offer</button>
      <button onClick={createAnswer}>Answer</button>
      <br />
      <textarea ref={ref => { textref = ref }} />
      {/* <br />
      <button onClick={setRemoteDescription}>Set Remote Desc</button>
      <button onClick={addCandidate}>Add Candidate</button> */}
    </div>
  );
}

export default App;
