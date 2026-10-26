import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PlaylistDetails from "./dashboard/PlaylistDetails";
import "./Home.css";
import "./dashboard/DashboardContent.css";
import "./dashboard/Discover.css";

// /collab/:id - a shared playlist with its songs and members.
function CollabPlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="music-home">
      <Navbar />
      <main className="standalone-shell">
        <PlaylistDetails
          key={id}
          playlistId={id}
          backLabel="← Collab Playlists"
          onBack={() => navigate("/collab")}
          onDeleted={() => navigate("/collab")}
          onOpenSong={(song) => navigate("/home", { state: { view: "song", songId: song.id } })}
        />
      </main>
    </div>
  );
}

export default CollabPlaylistDetail;
