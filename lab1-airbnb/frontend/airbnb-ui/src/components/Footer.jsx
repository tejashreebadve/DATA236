export default function Footer(){
  return (
    <footer className="border-t border-borderSubtle">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-textSecondary flex flex-wrap gap-4 justify-between">
        <div>© {new Date().getFullYear()} StayBnB, Inc.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-textPrimary">Terms</a>
          <a href="#" className="hover:text-textPrimary">Privacy</a>
          <a href="#" className="hover:text-textPrimary">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}
