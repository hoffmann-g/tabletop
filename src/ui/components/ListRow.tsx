/** A list item with a title, optional subtitle and open/rename/delete actions. */
export function ListRow({
  title,
  subtitle,
  onOpen,
  onRename,
  onDelete
}: {
  title: string
  subtitle?: string
  onOpen: () => void
  onRename?: () => void
  onDelete?: () => void | Promise<void>
}): JSX.Element {
  return (
    <div style={row}>
      <button onClick={onOpen} style={openBtn}>
        <span>{title}</span>
        {subtitle && <span style={{ opacity: 0.5, fontSize: 12 }}>{subtitle}</span>}
      </button>
      {onRename && (
        <button onClick={onRename} title="Rename" style={iconBtn}>
          ✏️
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => {
            if (confirm(`Delete "${title}"?`)) void onDelete()
          }}
          title="Delete"
          style={iconBtn}
        >
          🗑️
        </button>
      )}
    </div>
  )
}

const row: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'stretch' }
const openBtn: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  textAlign: 'left'
}
const iconBtn: React.CSSProperties = { padding: '6px 10px' }
