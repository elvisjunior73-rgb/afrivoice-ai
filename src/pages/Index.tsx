import HeroSection from "@/components/HeroSection";
import LanguagesSection from "@/components/LanguagesSection";
import PipelineSection from "@/components/PipelineSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import RoadmapSection from "@/components/RoadmapSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <LanguagesSection />
      <PipelineSection />
      <ArchitectureSection />
      <RoadmapSection />
      <Footer />
    </div>
  );
};

export default Index;
