const Footer = () => (
  <footer className="py-12 border-t border-border">
    <div className="container mx-auto px-6 text-center">
      <div className="font-display text-2xl font-bold text-gradient-hero mb-2">AfriVoice AI</div>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        Open source · Langues africaines · IA pour tous
      </p>
      <div className="flex justify-center gap-6 text-xs text-muted-foreground">
        <span>Lingala · Kikongo · Sango</span>
        <span>·</span>
        <span>RDC · Congo · Angola · RCA</span>
      </div>
    </div>
  </footer>
);

export default Footer;
