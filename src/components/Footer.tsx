const Footer = () => (
  <footer className="py-8 border-t border-border">
    <div className="container mx-auto px-6 text-center">
      <div className="font-display text-xl font-bold text-gradient-hero mb-2">AfriVoice AI</div>
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} AfriVoice AI — Tous droits réservés
      </p>
    </div>
  </footer>
);

export default Footer;
