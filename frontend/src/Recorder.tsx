import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import AudioPlayer from './components/AudioPlayer';
import Cookies from 'js-cookie';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import { v4 as uuidv4 } from 'uuid';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'

// Is this production?
const isProduction = import.meta.env.MODE === 'production';
console.log(isProduction)

interface FileMeta {
    id: string;
    file: Blob;
    url?: string;
    name: string;
    description: string;
    status?: 'removed' | 'uploading' | 'done' | 'error' | undefined;
    progress?: number; // percentage progress
}

interface FileState {
    id: string;
    state: string;
}


const apiUrl = 'https://api.rant.club';
const apiDomain = 'api.rant.club'

const Recorder: React.FC = () => {

    const ffmpegRef = useRef(new FFmpeg());

    const recorderControls = useAudioRecorder()

    const [filesMeta, setFilesMeta] = useState<FileMeta[]>([]);
    const [fileState, setFileState] = useState<FileState[]>([]);

    // Disclaimer Management
    const [isChecked, setIsChecked] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [sessionToken, setSessionToken] = useState<boolean>(false)

    const getSessionToken = () => {
        return isProduction
            ? Cookies.get('api.rant.club') // Fetch from cookie in production
            : localStorage.getItem('api.rant.club'); // Fetch from localStorage in development
    };

    useEffect(() => {
        const isSessionToken = getSessionToken();
        if (!isSessionToken) {
            console.log('No Session Token')
            setSessionToken(false)
        } else {
            console.log('Session Token Exists')
            setSessionToken(true)
        }
    }, [])

    const setSessionCookie = async () => {
        // Send the payload to your API
        const response = await axios.post(
            apiUrl + '/fetchCookie',
            { headers: { 'Content-Type': 'application/json' } }
        );
        const { sessionToken, expiresAt } = response.data

        if (isProduction) {
            Cookies.set('api.rant.club', sessionToken, {
                expires: new Date(expiresAt), // Set the expiration date
                secure: true, // Set the cookie to be sent only over HTTPS
                httpOnly: true, // Prevent client-side scripts from accessing the cookie
                sameSite: 'Strict',
                path: '/',
                domain: 'api.rant.club',
            });
            setSessionToken(true)
        } else {
            // For development, store in local storage (or a variable) as cookies won't work cross-domain
            localStorage.setItem('api.rant.club', sessionToken);
            setSessionToken(true)
        }

        // Debugging
        if (isProduction) {
            console.log('Cookie set in production:', Cookies.get());
        } else {
            console.log('Session token in localStorage:', localStorage.getItem('api.rant.club'));
        }
    }

    const handleUpload = async (file: File) => {
        if (!file) {
            console.log('No File Available.')
            return;
        }

        try {
            // Extract the file ID
            const fileId = file.name.split('.')[0]

            setFileState((prevFileState) => {
                const newFileStateData = [...prevFileState, { id: fileId, state: 'UPLOADING'}]
                return newFileStateData;
            })

            const sessionToken = isProduction
                ? Cookies.get('api.rant.club')
                : localStorage.getItem('api.rant.club')
            
            // Convert the file to Base64
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = (reader.result as string).split(',')[1]; // Get base64 data
                const payload = {
                    filename: file.name,
                    filedata: base64Data,
                };

                // Send the payload to your API
                const response = await axios.post(
                    apiUrl + '/upload',
                    payload,
                    { headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}`, // Use auth!
                    } }
                );

                console.log('File uploaded successfully: ' + response.data.message);
                setFileState((prevFileState) => {
                    const originalFileData = prevFileState.filter((entry: FileState) => entry.id !== fileId)
                    const newFileStateData = [...originalFileData, { id: fileId, state: 'COMPLETE'}]
                    return newFileStateData;
                })
            };
            reader.readAsDataURL(file);
        } catch (error: any) {
            console.log('Upload failed: ' + error.message);
            // Extract the file ID
            const fileId = file.name.split('.')[0]
            setFileState((prevFileState) => {
                const originalFileData = prevFileState.filter((entry: FileState) => entry.id !== fileId)
                const newFileStateData = [...originalFileData, { id: fileId, state: 'FAILED'}]
                return newFileStateData;
            })
        }
    };

    // const [loaded, setLoaded] = useState(false);

    const load = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
        const ffmpeg = ffmpegRef.current;
        
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
    }

    const displayRecording = async (blob: any) => {
        await load()
        const ffmpeg = ffmpegRef.current; 
        const webmFile = new File([blob], 'audio.webm', { type: 'audio/webm' });
        ffmpeg.writeFile('audio.webm', await fetchFile(webmFile));

        // Run ffmpeg to convert to mp3
        await ffmpeg.exec(['-i', 'audio.webm', 'audio.mp3']);

        // Get the output mp3
        const mp3Data = await ffmpeg.readFile('audio.mp3');
        const data = new Uint8Array(mp3Data as ArrayBuffer);

        // Create a Blob from the converted file
        const mp3Blob = new Blob([data.buffer], { type: 'audio/mp3' });

        const fileName = uuidv4()
        const newFileMeta: FileMeta = {
            id: fileName, // Unique identifier for this file
            file: mp3Blob, // The actual file object
            name: `${fileName}.mp3`, // Initialize the name as an empty string
            description: '', // Initialize the description as an empty string
        };

        // Send the file to the API
        const file = new File([mp3Blob], `${fileName}.mp3`, { type: 'audio/mp3' });
        handleUpload(file)

        // Ensure the file doesn't already exist in the filesMeta
        setFilesMeta((prevFilesMeta) => {
            return [...prevFilesMeta, newFileMeta];
        });
    }

    return (
        <div className="app-container">
            <header className="header">
                <div className='rant-section'>
                    <h1 className="rant-title">Got a Rant?</h1>


                </div>

                <div className="logo-container">
                    <img src="logo.png" alt="Rant Club Logo" className="logo" />
                </div>
            </header>

            <div className="recording-box">
                {sessionToken ? (
                    <>
                        
                    </>
                ) : (
                    <>
                        Hello!

                        So, you want to shout at the internet? That's why we are here. To be transparent though, we need you to accept our Cookie Policy.
                        <br></br><br></br>

                        (Don't worry, you can rant about that too, we hate cookies too).
                        <br></br><br></br>

                        It's important that we remain compliant with data privacy laws. When you record your audio, we store it. We need to be able to give 
                        you (the rantee) a way to manage your audio once it's recorded AND to create a way that it will be automatically deleted after a year (365 days) if 
                        you decide not to create an account with us and get access to manage the data at a later date.
                        <br></br><br></br>

                        If you don't sign up, then all we can do, is use this cookie to display recordings you may have created in the past. To delete them however 
                        you will need to sign up.
                        <br></br><br></br>

                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => {setSessionCookie()}}    
                        >Accept</button>

                    </>
                )}
                
                <div className="recording-box-content">
                    {isChecked ? (
                        <>
                            <div className='hidden-recorder'>
                                <AudioRecorder
                                    onRecordingComplete={(blob: Blob) => displayRecording(blob)}
                                    recorderControls={recorderControls}
                                />
                            </div>
                            {recorderControls.isRecording ? (
                                <>
                                    <button 
                                        onClick={() => recorderControls.stopRecording()}
                                        className='circular-button'
                                    >
                                        <StopIcon className="w-8 h-8 text-red-500" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => recorderControls.startRecording()}
                                        className='circular-button'
                                    >
                                        <MicrophoneIcon className="w-8 h-8 text-red-500" />
                                    </button>
                                </>
                            )}
                            
                            <div className='hidden-recorder visualizer-box'>
                                <AudioRecorder
                                    showVisualizer
                                    recorderControls={recorderControls}
                                />
                            </div>
                            
                        </>
                    ): (
                        <></>
                    )}
                    

                    {isModalOpen ? (
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Close
                        </button>
                    ): (
                        <>
                            {isChecked ? (<></>) : (
                                <>
                                    Before you can record your rant, you need to read and accept our disclaimer.

                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        {isChecked ? (<>Accepted</>) : (<>Read & Accept</>)}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            At Rant Club, we're on a mission! First and foremost, our founders were thinking;
                            <br></br><br></br>
                            "Sometimes, it's just good to say it out loud..."
                            <br></br><br></br>
                            So here it is, a place to just rant. Today, all we'll do is record and store your rant anonymously. In the future, we intend to provide users the ability to manage previous rants.
                            <br></br><br></br>
                            Why do we want to do this?
                            <br></br><br></br>
                            <ul>
                                <li>
                                    We want to process the audio into text after we record it. Then, we want to use that text to create useful insights - like maybe, everyone has been ranting about the weather today, or a particular company. Whilst the 'rantee' will remain anonymous, we can still draw out useful insights.
                                    Thinking of the future, this might become a new way to 'score' a company based on it's service level and the number of rants.
                                </li>
                                <br></br><br></br>
                                <li>
                                    Unless you sign up (future features), your recordings remain anonymous (current option), but that means that once you've agreed to this disclaimer and recorded and saved your audio, it cannot be found and deleted, since we won't maintain any identifiable information linked to the recording.
                                </li>
                                <br></br><br></br>
                                <li>
                                    We will use the audio in the future to build voice models. This means we could very specifically build an accented english speaking voice, from a corpus of rants our users submit. We will redact for the most part profanity and will not keep recordings of specific nature.
                                </li>
                            </ul>
                            <br></br><br></br>
                            What should you know before you record?
                            <br></br><br></br>
                            <ul>
                                <li>
                                    We will process you audio, employees of the organisation may listen to the audio to confirm intent, meaning and other facets, in order to improve the results of our voice model generation.
                                </li>
                                <br></br><br></br>
                                <li>
                                    If you do not sign up (currently unavailable), you will not be able to delete any audio you have recorded and you waive any rights to the recorded audio.
                                </li>
                                <br></br><br></br>
                                <li>
                                    Audio recording is disabled unless you agree to this disclaimer, therefore if you have recorded audio, you agree to the terms above.
                                </li>
                                <br></br><br></br>
                                <li>
                                    We will not synthesise voices as an imitation of any single "rantee". We intend to use the collection (language, accent, gender, etc) to synthesise new/unique realistic voices.
                                </li>
                            </ul>
                            <br></br><br></br>
                            If you have read the disclaimer and are still comfortable to record your rant, please tick below and proceed.
                            <br></br><br></br>



                            <input
                                type="checkbox"
                                id="consent"
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                            />
                            <label htmlFor="consent">  I consent to audio recording</label>
                            <br></br><br></br>

                            <div className='modal-button'>
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
                                    onClick={() => setIsModalOpen(false)}
                                >Close</button>
                            </div>
                            
                        </div>
                    </div>
                )}
            </div>

            <div className="recording-box">
                <table>
                    <thead>
                        <tr className="file-table">
                            {/* <th className='file-table'>Format</th>
                            <th className='file-table'>Size</th> */}
                            <th className='file-table'>State</th>
                            <th className='file-table'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filesMeta.length === 0 ? (
                            <tr className='file-table'>
                                <td colSpan={4}>No files recorded</td>
                            </tr>
                        ) : (
                            filesMeta.map((file: FileMeta) => {
                                const stateInfo = fileState.filter(entry => entry.id === file.name.split('.')[0])[0].state
                                return (
                                    <tr className='file-table' key={file.name}>
                                        {/* <td>{file.file.type}</td>
                                        <td>{(file.file.size / 1024).toFixed(1)}Kb</td> */}
                                        <td>{stateInfo}</td>
                                        <td>
                                            <AudioPlayer file={file.file} />
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>

            </div>
        </div>
    );
};

export default Recorder;
