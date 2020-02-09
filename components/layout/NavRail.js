import { useState } from "react";
import Icon from "../shared/Icon";
import Avatar from "../shared/Avatar";
import styles from "../../styles/Chat.module.css";

export default function NavRail({ user, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className={styles.navRail}>

            <div style={{ flex: 1 }} />

            <button className={styles.navBtn}>
                <Icon name="settings" size={18} />
            </button>

            <div style={{ position: "relative", marginTop: 6 }}>
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0
                    }}
                    title={user?.displayName || user?.username || "You"}
                >
                    <Avatar
                        user={user}
                        size={34}
                        showDot
                        dotColor="#0f172a"
                        online
                    />
                </button>
                {menuOpen && (
                    <div className={styles.navMenu}>
                        <div className={styles.navMenuHeader}>
                            <div className={styles.navMenuName}>
                                {user?.displayName || user?.username || "You"}
                            </div>
                            <div className={styles.navMenuEmail}>
                                {user?.email || ""}
                            </div>
                        </div>
                        <button
                            className={styles.navMenuSignOut}
                            onClick={onLogout}
                        >
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
