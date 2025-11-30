import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Switch, Platform, PermissionsAndroid, Alert, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    createAgoraRtcEngine,
    IRtcEngine,
    RtcSurfaceView,
    RenderModeType,
    ChannelProfileType,
    ClientRoleType,
    ChannelMediaOptions,
} from 'react-native-agora';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const appId = '57fa3a819eb94c36b8bea743cccea4c3'; // <-- Replace with your App ID
// The token MUST be generated for the UID used in joinChannel (here, UID 0)
const token = '007eJxTYFh6ejv/Rs7OQ5wMfyM4T0n5PGDILoxQLvzNd775guOWGDsFBlPztETjRAtDy9QkS5NkY7Mki6TURHMT4+Tk5NREoMDsz2qZDYGMDKzKvMyMDBAI4rMxJGcWJeekMjAAAB9wHmw='; // <-- Replace with your Token
const channelName = 'circle';
const localUid = 0;

const App = () => {
    const engineRef = useRef<IRtcEngine | null>(null);
    const [isJoined, setIsJoined] = useState(false);
    const [isHost, setIsHost] = useState(true);
    const [remoteUid, setRemoteUid] = useState(0);
    const [message, setMessage] = useState('Initialize Agora...');

    useEffect(() => {
        initAgora();
        return () => {
            engineRef.current?.stopPreview();
            engineRef.current?.leaveChannel();
            engineRef.current?.release();
        };
    }, []);

    const getPermissions = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]);
            if (
                granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED ||
                granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED
            ) {
                Alert.alert('Permissions Required', 'Camera and microphone permissions are needed for video calling.');
                return false;
            }
        }
        return true;
    };

    const initAgora = async () => {
        if (!(await getPermissions())) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId });
        engine.enableVideo();

        engine.registerEventHandler({
            onJoinChannelSuccess: (_conn, uid, _elapsed) => setIsJoined(true),
            onUserJoined: (_conn, uid) => {
                setRemoteUid(uid);
                engineRef.current?.setupRemoteVideo({ uid, renderMode: RenderModeType.RenderModeFit });
            },
            onUserOffline: (_conn, uid) => setRemoteUid(0),
            onError: (e, msg) => setMessage(`Error: ${e} (${msg})`),
        });
    };

    const joinChannel = async () => {
        if (!engineRef.current || isJoined) return;
        if (!(await getPermissions())) return;

        engineRef.current.startPreview();

        const options: ChannelMediaOptions = {
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
            clientRoleType: isHost ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience,
        };

        engineRef.current.joinChannel(token, channelName, localUid, options);
    };

    const leaveChannel = () => {
        engineRef.current?.stopPreview();
        engineRef.current?.leaveChannel();
        setIsJoined(false);
        setRemoteUid(0);
        setMessage('Left the channel');
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* Top Call Info */}
            {isJoined && (
                <View className="w-full px-4 pt-4 flex-row justify-between items-center z-20">
                    <Text className="text-gray-300">{remoteUid !== 0 ? 'Connected' : 'Ringing...'}</Text>
                </View>
            )}

            {/* Remote Video */}
            <RtcSurfaceView
                canvas={{ uid: remoteUid || 0, renderMode: RenderModeType.RenderModeHidden }}
                className="w-full h-full bg-black"
            />

            {/* Local Video Overlay */}
            {isJoined && (
                <View className="absolute top-16 right-4 w-28 h-36 border border-white rounded-xl overflow-hidden shadow-lg z-30">
                    <RtcSurfaceView
                        canvas={{ uid: localUid, renderMode: RenderModeType.RenderModeFit }}
                        className="w-full h-full"
                    />
                </View>
            )}

            {/* Bottom Controls */}
            {/* Bottom Controls */}
            <View className="absolute bottom-20 w-full px-8 flex-row justify-evenly items-center z-30">
                {isJoined ? (
                    <>
                        {/* End Call */}
                        <Pressable
                            onPress={leaveChannel}
                            className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-lg">End</Text>
                        </Pressable>

                        {/* Reverse Camera */}
                        <Pressable
                            onPress={() => engineRef.current?.switchCamera()}
                            className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-sm">Flip</Text>
                        </Pressable>
                    </>
                ) : (
                    <Pressable
                        onPress={joinChannel}
                        className="bg-blue-600 w-40 py-4 rounded-full shadow-lg flex items-center justify-center"
                    >
                        <Text className="text-white font-bold text-lg">Join Call</Text>
                    </Pressable>
                )}
            </View>



        </SafeAreaView>


    );
};

export default App;
