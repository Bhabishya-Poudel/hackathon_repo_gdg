import { useEffect, useRef, useState } from 'react';
import { backendUrl, isLocalBackendUrl } from '../lib/platform';
import styles from './Dashboard.module.css';

interface StreamRequest {
  id: number;
  phoneId: string | number;
  text: string;
  status: string;
  receivedAt: Date;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disabled' | 'error';
const localStreamEnabled = import.meta.env.DEV && isLocalBackendUrl();

function isRequest(value: unknown): value is { phone_id: string | number; text: string; status: string } {
  if (!value || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  return (
    (typeof record.phone_id === 'string' || typeof record.phone_id === 'number') &&
    typeof record.text === 'string' &&
    typeof record.status === 'string'
  );
}

export default function Dashboard() {
  const [requests, setRequests] = useState<StreamRequest[]>([]);
  const [connection, setConnection] = useState<ConnectionState>(
    localStreamEnabled ? 'connecting' : 'disabled',
  );
  const [streamError, setStreamError] = useState('');
  const nextId = useRef(0);

  useEffect(() => {
    document.title = 'Telegram Request Monitor - CivicText';
  }, []);

  useEffect(() => {
    if (!localStreamEnabled) return;

    const stream = new EventSource(`${backendUrl}/stream`);
    stream.onopen = () => {
      setConnection('connected');
      setStreamError('');
    };
    stream.onmessage = (event) => {
      let payload: unknown;
      try {
        payload = JSON.parse(event.data);
      } catch {
        setConnection('error');
        setStreamError('The backend sent an unreadable stream event.');
        return;
      }

      if (!isRequest(payload)) {
        setConnection('connected');
        return;
      }

      setRequests((current) => [
        {
          id: nextId.current++,
          phoneId: payload.phone_id,
          text: payload.text,
          status: payload.status,
          receivedAt: new Date(),
        },
        ...current,
      ].slice(0, 50));
      setConnection('connected');
      setStreamError('');
    };
    stream.onerror = () => {
      setConnection('reconnecting');
      setStreamError('Could not reach the backend stream. The browser will retry automatically.');
    };

    return () => stream.close();
  }, []);

  const statusText: Record<ConnectionState, string> = {
    connecting: 'Connecting to backend…',
    connected: 'Connected to backend stream',
    reconnecting: 'Connection interrupted',
    disabled: 'Live stream disabled outside local development',
    error: 'Stream error',
  };

  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.kicker}>Backend monitor</p>
        <h1 className={styles.title}>Incoming Telegram requests</h1>
        <p className={styles.lead}>
          This local development view listens to the backend&rsquo;s
          {' '}<code>/stream</code> endpoint. Telegram replies are sent directly
          to the person in Telegram.
        </p>

        <p className={`${styles.connection} ${styles[connection]}`} role="status">
          <span className={styles.statusDot} aria-hidden="true" />
          {statusText[connection]}
        </p>

        {!localStreamEnabled ? (
          <div className={styles.notice}>
            The live stream is only enabled in local development when the
            backend URL is localhost. The current stream has no authentication
            and contains message text and Telegram chat IDs; do not expose it
            publicly before backend authentication is added.
          </div>
        ) : (
          <>
            {streamError && <p className={styles.error} role="alert">{streamError}</p>}
            <div className={styles.feedHeader}>
              <h2>Recent requests</h2>
              <span>{requests.length} received this session</span>
            </div>

            {requests.length === 0 ? (
              <div className={styles.empty}>
                Requests from the Telegram bot will appear here while the
                backend is running.
              </div>
            ) : (
              <ul className={styles.list} aria-live="polite">
                {requests.map((request) => (
                  <li className={styles.request} key={request.id}>
                    <div className={styles.requestHeader}>
                      <strong>{request.status}</strong>
                      <time dateTime={request.receivedAt.toISOString()}>
                        {request.receivedAt.toLocaleTimeString()}
                      </time>
                    </div>
                    <p className={styles.message}>{request.text}</p>
                    <p className={styles.chatId}>Telegram chat ID: {request.phoneId}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
