import logo from "./logo.svg";
import "./App.css";
import { socket } from "./socket";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import Peer from "simple-peer";
function App() {
  const [id, setId] = useState("");
  const [receiver, setReceiver] = useState("")

  const [caller, setCaller] = useState({})
  const [isCallOngoing, setCallOngoing] = useState(false)

  const myVideo = useRef();
  const userVideo = useRef();
  const [stream, setStream] = useState({})
  useEffect(() => {
    socket.on('me', id => {
      setId(id)
    })
    navigator.mediaDevices.getUserMedia({ video: true, audio: true,  })
      .then((currentStream) => {
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;
        
        socket.on('calling', payload => {
          console.log(payload, 'calling')
          setCaller(payload)
        })
        socket.on('disconnected user', payload => {
          console.log('payload', payload)
          setCallOngoing(false)
          setCaller({})
        })
      });
  }, []);

  return (
    <div className="App">
      <div className="video-call">
        <div className="video-container">
          <video ref={myVideo} muted autoPlay style={{ width: '100%'}}></video>
        </div>
        <div className="video-container">
          <video ref={userVideo} autoPlay style={{ width: '100%', display: isCallOngoing ? 'block' : 'none'}} />
        </div>
        {
          (Object.keys(caller).length > 0 && !isCallOngoing) && <div className="caller-container">
          <span>Someone is calling</span>
          <button onClick={()=>{
            const peer = new Peer({ initiator: false, trickle: false, stream });
            peer.on('signal', (data) => {
              socket.emit('call answered', {
                receiverId: caller.senderId,
                roomId: caller.roomId,
                signal: data
              })
            });
            peer.on('stream', (currentStream) => {
              userVideo.current.srcObject = currentStream;
            });
            peer.signal(caller.signal);
            peer.on('error', (err) => {
              console.log(err);
            })
            setCallOngoing(true)
          }}>Answer call</button>
        </div>
        }

        <div className="caller-container">
          <span>My ID: {id}</span>
          <input type="text" value={receiver} onChange={(e)=>{ setReceiver(e.currentTarget.value) }}></input>
          <button onClick={()=>{
            const peer = new Peer({ initiator: true, trickle: false, stream });
            peer.on('stream', (currentStream) => {
              userVideo.current.srcObject = currentStream;
            });
            peer.on('signal', (data) => {
              console.log(data,'data')
              socket.emit('call user', {
                receiverId: receiver,
                roomId: uuidv4(),
                signal: data
              })
            });
           

            const callConnected = (payload) => {
              setCallOngoing(true)
              setCaller({})
              peer.signal(payload.signal)
            }

            socket.on('call connected', callConnected)
            peer.on('error', (err) => {
              console.log(err);
              socket.off('call connected', callConnected);
            })
           
          }}>Call user</button>
        </div>
      </div>
    </div>
  );
}

export default App;
