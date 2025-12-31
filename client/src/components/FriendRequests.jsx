export default function FriendRequests({ requests = [], loading = false, onAccept, onReject }) {
  if (loading) return <div style={{ padding: '0.75rem', color: 'var(--muted)' }}>Loading...</div>;
  if (!requests.length) return null;

  return (
    <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
      <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--muted)' }}>
        Friend Requests ({requests.length})
      </div>
      {requests.map((req) => (
        <div
          key={req._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            borderBottom: '1px solid var(--border)',
            marginBottom: '0.5rem',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{req.requester.name}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              onClick={() => onAccept?.(req._id)}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.8rem',
                background: 'var(--primary)',
                border: 'none',
                color: '#0b1020',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Accept
            </button>
            <button
              onClick={() => onReject?.(req._id)}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.8rem',
                background: 'var(--danger)',
                border: 'none',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
