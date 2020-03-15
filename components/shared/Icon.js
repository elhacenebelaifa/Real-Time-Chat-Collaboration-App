export default function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.6 }) {
  const p = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    search:      <><circle cx="7.5" cy="7.5" r="4.5" {...p}/><path d="M11 11l3 3" {...p}/></>,
    plus:        <path d="M8 3v10M3 8h10" {...p}/>,
    hash:        <path d="M5 2l-1 12M11 2l-1 12M2 5h12M2 11h12" {...p}/>,
    at:          <><circle cx="8" cy="8" r="3" {...p}/><path d="M11 8v1.2a1.8 1.8 0 0 0 3.6 0V8A6.6 6.6 0 1 0 11 14" {...p}/></>,
    phone:       <path d="M4 3.5h2l1 3-1.5 1a7 7 0 0 0 3 3l1-1.5 3 1v2a1.5 1.5 0 0 1-1.5 1.5A9.5 9.5 0 0 1 2.5 5 1.5 1.5 0 0 1 4 3.5z" {...p}/>,
    video:       <><rect x="1.5" y="4" width="9" height="8" rx="1.2" {...p}/><path d="M10.5 7l4-2v6l-4-2z" {...p}/></>,
    paperclip:   <path d="M13 7.5l-5.5 5.5a3 3 0 1 1-4.2-4.2L8.5 3a2 2 0 1 1 2.8 2.8L6 11.1a1 1 0 1 1-1.4-1.4l4.9-4.9" {...p}/>,
    smile:       <><circle cx="8" cy="8" r="5.5" {...p}/><path d="M5.8 9.5c.6.8 1.3 1.2 2.2 1.2s1.6-.4 2.2-1.2" {...p}/><circle cx="6.2" cy="7" r=".5" fill={color}/><circle cx="9.8" cy="7" r=".5" fill={color}/></>,
    mic:         <><rect x="6" y="2" width="4" height="7" rx="2" {...p}/><path d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14" {...p}/></>,
    send:        <path d="M2 8l12-5-5 12-2-4.5z" {...p}/>,
    dots:        <><circle cx="4" cy="8" r="1" fill={color}/><circle cx="8" cy="8" r="1" fill={color}/><circle cx="12" cy="8" r="1" fill={color}/></>,
    pin:         <path d="M8 1.5L11 4.5l-1 1 1.5 3.5-2 2-3.5-1.5-1 1-3-3 1-1L3.5 3l2-2 2.5 1z" {...p}/>,
    thread:      <path d="M3 4h10M3 8h7M3 12h4M11 10v3l2.5-2z" {...p}/>,
    reply:       <path d="M6 4L2 8l4 4M2 8h8a4 4 0 0 1 4 4v1" {...p}/>,
    edit:        <path d="M11.5 2.5l2 2L5 13l-2.5.5L3 11z" {...p}/>,
    trash:       <path d="M3 4h10M6 4V2.5h4V4M4.5 4v8.5h7V4" {...p}/>,
    check:       <path d="M3 8.5l3 3 7-7" {...p}/>,
    checkDouble: <path d="M2 8l2.5 2.5L9 6M7 10.5L9.5 13 14 8.5" {...p}/>,
    x:           <path d="M3 3l10 10M13 3L3 13" {...p}/>,
    bell:        <path d="M8 2c-2.5 0-4 1.5-4 4v2.5L2.5 11h11L12 8.5V6c0-2.5-1.5-4-4-4zM6 12.5a2 2 0 0 0 4 0" {...p}/>,
    settings:    <><circle cx="8" cy="8" r="2.2" {...p}/><path d="M8 1.5v1.5M8 13v1.5M1.5 8h1.5M13 8h1.5M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M3.3 12.7l1.1-1.1M11.6 4.4l1.1-1.1" {...p}/></>,
    compose:     <path d="M2 13h12M9 3l3 3-6 6H3V9z" {...p}/>,
    lock:        <><rect x="3" y="7" width="10" height="7" rx="1" {...p}/><path d="M5 7V5a3 3 0 0 1 6 0v2" {...p}/></>,
    users:       <><circle cx="6" cy="6" r="2" {...p}/><path d="M2 13a4 4 0 0 1 8 0" {...p}/><circle cx="11" cy="5.5" r="1.8" {...p}/><path d="M10.5 13a3.5 3.5 0 0 1 3.5-3.5" {...p}/></>,
    chevron:     <path d="M4 6l4 4 4-4" {...p}/>,
    chevronR:    <path d="M6 4l4 4-4 4" {...p}/>,
    play:        <path d="M4 3l9 5-9 5z" {...p}/>,
    file:        <path d="M4 1.5h5l3 3V14a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5zM9 1.5V5h3" {...p}/>,
    link:        <path d="M7 9l2-2M6 4.5l1.5-1.5a2.5 2.5 0 0 1 3.5 3.5L9.5 8M9 11.5l-1.5 1.5a2.5 2.5 0 0 1-3.5-3.5L6 8" {...p}/>,
    popOut:      <><path d="M9 3h4v4" {...p}/><path d="M13 3l-5 5" {...p}/><path d="M11 9v3.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5H7" {...p}/></>,
  };
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
}
