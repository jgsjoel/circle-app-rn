// useAgoraService.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    IRtcEngineEventHandler,
    RtcConnection,
    ChannelMediaOptions
} from 'react-native-agora';

const APP_ID = '57fa3a819eb94c36b8bea743cccea4c3';
const TOKEN = '007eJxTYFh6ejv/Rs7OQ5wMfyM4T0n5PGDILoxQLvzNd775guOWGDsFBlPztETjRAtDy9QkS5NkY7Mki6TURHMT4+Tk5NREoMDsz2qZDYGMDKzKvMyMDBAI4rMxJGcWJeekMjAAAB9wHmw=';
const CHANNEL_NAME = 'circle';

const LOCAL_UID = 0;

// PERMISSIONS
const requestPermissions = async () => {
    if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
    }
};

export const useAgoraService = (isHost: boolean = true) => {
    const engineRef = useRef<IRtcEngine | null>(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState<number>(0);
    const [message, setMessage] = useState('');

    // LOCAL VIDEO SETUP
    const setupLocalVideo = useCallback(() => {
        if (!engineRef.current) return;

        engineRef.current.enableVideo();

        engineRef.current.setupLocalVideo({
            uid: LOCAL_UID,
            renderMode: 1,
        });

        engineRef.current.startPreview();
    }, []);

    // INITIALIZE ENGINE
    useEffect(() => {
        const init = async () => {
            await requestPermissions();

            const engine = createAgoraRtcEngine();
            engineRef.current = engine;

            engine.initialize({ appId: APP_ID });

            const handler: IRtcEngineEventHandler = {
                onJoinChannelSuccess: () => {
                    setMessage(`Joined channel ${CHANNEL_NAME}`);
                    setIsJoined(true);
                },

                onUserJoined: (_connection: RtcConnection, uid: number) => {
                    setRemoteUid(uid);

                    engineRef.current?.setupRemoteVideo({
                        uid,
                        renderMode: 1,
                    });

                    setMessage(`Remote user ${uid} joined`);
                },

                onUserOffline: (_connection, uid) => {
                    setMessage(`Remote user ${uid} left`);
                    setRemoteUid(0);
                },

                onError: (err) => {
                    setMessage(`Error: ${err}`);
                }
            };

            engine.registerEventHandler(handler);
        };

        init();

        // CLEAN UP
        return () => {
            engineRef.current?.stopPreview?.();
            engineRef.current?.leaveChannel?.();
            engineRef.current?.unregisterEventHandler({});
            engineRef.current?.release?.();
            engineRef.current = null;
        };
    }, []);

    // JOIN CHANNEL
    const joinChannel = useCallback(() => {
        if (!engineRef.current || isJoined) return;

        const options: ChannelMediaOptions = {
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
            clientRoleType: isHost
                ? ClientRoleType.ClientRoleBroadcaster
                : ClientRoleType.ClientRoleAudience,
        };

        setupLocalVideo(); // MUST COME BEFORE JOINING

        engineRef.current.joinChannel(
            TOKEN,
            CHANNEL_NAME,
            LOCAL_UID,
            options
        );
    }, [isJoined, isHost, setupLocalVideo]);

    // LEAVE CHANNEL
    const leaveChannel = useCallback(() => {
        engineRef.current?.leaveChannel();
        setIsJoined(false);
        setRemoteUid(0);
        setMessage('Left channel');
    }, []);

    return {
        agoraEngine: engineRef.current,
        isJoined,
        remoteUid,
        message,
        joinChannel,
        leaveChannel,
    };
};
