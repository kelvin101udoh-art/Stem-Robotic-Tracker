// apps/mobile/app/capture.tsx

import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/ui/components/Screen';
import { Card } from '../src/ui/components/Card';
import { Button } from '../src/ui/components/Button';
import { StatusPill } from '../src/ui/components/StatusPill';
import { theme } from '../src/ui/theme';
import { SessionStorageService } from '../src/core/session';
import { VoiceRecorder, type CaptureFile } from '../src/core/recorder';
import { submitCapture } from '../src/api/captures';
import type { SessionContextDTO } from 'stemtrack-sdk';

type UIState =
  | 'READY'
  | 'CAPTURING'
  | 'REVIEW'
  | 'UPLOADING'
  | 'SUBMITTED'
  | 'FAILED';

export default function CaptureScreen() {
  const router = useRouter();
  const recorder = useMemo(() => new VoiceRecorder(), []);
  const [session, setSession] = useState<SessionContextDTO | null>(null);

  const [ui, setUi] = useState<UIState>('READY');
  const [file, setFile] = useState<CaptureFile | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await SessionStorageService.getSession();
      if (!s) {
        router.replace('/');
        return;
      }
      if (mounted) {
        setSession(s);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function onStart() {
    setMessage('');
    try {
      await recorder.start();
      setUi('CAPTURING');
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to start capture.');
      setUi('FAILED');
    }
  }

  async function onStop() {
    setMessage('');
    try {
      const f = await recorder.stop();
      if (f.durationMs > 3 * 60 * 1000) {
        await recorder.discard(f.uri);
        setMessage('Please keep reflections under 3 minutes.');
        setUi('FAILED');
        return;
      }
      setFile(f);
      setUi('REVIEW');
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to stop capture.');
      setUi('FAILED');
    }
  }

  async function onDiscard() {
    setMessage('');
    if (file) await recorder.discard(file.uri);
    setFile(null);
    setUi('READY');
  }

  async function onSubmit() {
    if (!file || !session) return;
    setUi('UPLOADING');
    setMessage('Submitting capture securely…');

    try {
      const res = await submitCapture({
        sessionToken: session.sessionId,
        file,
      });
      setMessage(
        `Submitted. Report is generating in STEMTrack. Ref: ${res.capture_id}`
      );
      await recorder.discard(file.uri);
      setFile(null);
      setUi('SUBMITTED');
      setTimeout(() => setUi('READY'), 1800);
    } catch (e: unknown) {
      setMessage(
        e instanceof Error ? e.message : 'Submit failed. Please try again.'
      );
      setUi('FAILED');
    }
  }

  async function onChangeKey() {
    await SessionStorageService.clearSession();
    router.replace('/');
  }

  const pillStatus = ui === 'REVIEW' ? 'READY' : ui;

  return (
    <Screen>
      <Card>
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: theme.color.text,
              }}
            >
              Session Capture
            </Text>
            <StatusPill status={pillStatus as never} />
          </View>

          <Text style={{ color: theme.color.subtext, lineHeight: 20 }}>
            Capture what happened during the session. STEMTrack will generate
            structured evidence.
          </Text>

          {ui === 'READY' && <Button label="Start Capture" onPress={onStart} />}

          {ui === 'CAPTURING' && <Button label="Stop" onPress={onStop} />}

          {ui === 'REVIEW' && (
            <View style={{ gap: theme.spacing.sm }}>
              <Button label="Submit to STEMTrack" onPress={onSubmit} />
              <Button
                label="Discard"
                onPress={onDiscard}
                variant="secondary"
              />
            </View>
          )}

          {ui === 'UPLOADING' && (
            <Button
              label="Submitting…"
              onPress={() => {}}
              disabled
              loading
            />
          )}

          {message.length > 0 && (
            <Text
              style={{
                color: ui === 'FAILED' ? theme.color.danger : theme.color.text,
              }}
            >
              {message}
            </Text>
          )}

          <Text
            onPress={onChangeKey}
            style={{ color: theme.color.muted, marginTop: theme.spacing.md }}
          >
            Change Access Key
          </Text>

          <Text
            style={{
              color: theme.color.muted,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            Raw captures are discarded from local storage after submission.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}