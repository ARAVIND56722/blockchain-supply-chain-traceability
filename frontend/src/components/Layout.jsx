import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children, topbarProps }) {
  return (
    <div className="container">
      <Sidebar />
      <main className="main">
        <Topbar {...topbarProps} />
        {children}
      </main>
    </div>
  );
}