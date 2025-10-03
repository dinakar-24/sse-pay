import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Save, X, Camera, Linkedin, Github, Instagram, Twitter, Youtube, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";

interface Developer {
  id: string;
  name: string;
  role: string;
  image: string;
  linkedin: string;
  github: string;
  instagram: string;
  twitter: string;
  youtube?: string;
}

const DeveloperTeam = () => {
  const navigate = useNavigate();

  // Load developers from localStorage or use defaults
  const loadDevelopers = (): Developer[] => {
    try {
      const saved = localStorage.getItem('developerTeam');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading developers:', error);
    }
    
    return [
      {
        id: "1",
        name: "Arjun Sharma",
        role: "Full Stack Developer",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        linkedin: "https://linkedin.com/in/arjun-sharma",
        github: "https://github.com/arjun-sharma",
        instagram: "https://instagram.com/arjun_sharma",
        twitter: "https://twitter.com/arjun_sharma",
        youtube: "https://youtube.com/@arjun_sharma",
      },
      {
        id: "2", 
        name: "Priya Patel",
        role: "Frontend Developer",
        image: "https://images.unsplash.com/photo-1494790108755-2616b612b977?w=100&h=100&fit=crop&crop=face",
        linkedin: "https://linkedin.com/in/priya-patel",
        github: "https://github.com/priya-patel",
        instagram: "https://instagram.com/priya_patel",
        twitter: "https://twitter.com/priya_patel",
      },
      {
        id: "3",
        name: "Rahul Kumar",
        role: "Backend Developer", 
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        linkedin: "https://linkedin.com/in/rahul-kumar",
        github: "https://github.com/rahul-kumar",
        instagram: "https://instagram.com/rahul_kumar",
        twitter: "https://twitter.com/rahul_kumar",
      },
      {
        id: "4",
        name: "Sneha Reddy",
        role: "UI/UX Designer",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        linkedin: "https://linkedin.com/in/sneha-reddy",
        github: "https://github.com/sneha-reddy",
        instagram: "https://instagram.com/sneha_reddy",
        twitter: "https://twitter.com/sneha_reddy",
      },
    ];
  };

  const [developers, setDevelopers] = useState<Developer[]>(loadDevelopers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: "", 
    role: "", 
    linkedin: "", 
    github: "", 
    instagram: "", 
    twitter: "",
    youtube: ""
  });

  // Save developers to localStorage
  const saveDevelopers = (newDevelopers: Developer[]) => {
    try {
      localStorage.setItem('developerTeam', JSON.stringify(newDevelopers));
    } catch (error) {
      console.error('Error saving developers:', error);
    }
  };

  const handleEdit = (dev: Developer) => {
    setEditingId(dev.id);
    setEditForm({ 
      name: dev.name, 
      role: dev.role,
      linkedin: dev.linkedin,
      github: dev.github,
      instagram: dev.instagram,
      twitter: dev.twitter,
      youtube: dev.youtube || ""
    });
  };

  const handleSave = (id: string) => {
    const newDevelopers = developers.map(dev => 
      dev.id === id 
        ? { 
            ...dev, 
            name: editForm.name, 
            role: editForm.role,
            linkedin: editForm.linkedin,
            github: editForm.github,
            instagram: editForm.instagram,
            twitter: editForm.twitter,
            youtube: editForm.youtube || undefined
          }
        : dev
    );
    setDevelopers(newDevelopers);
    saveDevelopers(newDevelopers);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ 
      name: "", 
      role: "", 
      linkedin: "", 
      github: "", 
      instagram: "", 
      twitter: "",
      youtube: ""
    });
  };

  const handleImageChange = (id: string, newImageUrl: string) => {
    const newDevelopers = developers.map(dev =>
      dev.id === id ? { ...dev, image: newImageUrl } : dev
    );
    setDevelopers(newDevelopers);
    saveDevelopers(newDevelopers);
  };

  const handleImageUpload = (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          handleImageChange(id, result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Developer Team</h1>
          <p className="text-muted-foreground">Meet the talented individuals behind this project</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {developers.map((dev) => (
            <div key={dev.id} className="bg-card border rounded-lg p-6 group hover-scale shadow-card">
              <div className="relative mb-4">
                <img
                  src={dev.image}
                  alt={dev.name}
                  className="w-24 h-24 rounded-full mx-auto shadow-card object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-smooth bg-primary text-primary-foreground hover:bg-primary/80"
                  onClick={() => handleImageUpload(dev.id)}
                >
                  <Camera className="h-3 w-3" />
                </Button>
                {editingId !== dev.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-smooth bg-primary text-primary-foreground hover:bg-primary/80"
                    onClick={() => handleEdit(dev)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {editingId === dev.id ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="Name"
                  />
                  <Input
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="Role"
                  />
                  <Input
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="LinkedIn URL"
                  />
                  <Input
                    value={editForm.github}
                    onChange={(e) => setEditForm(prev => ({ ...prev, github: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="GitHub URL"
                  />
                  <Input
                    value={editForm.instagram}
                    onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="Instagram URL"
                  />
                  <Input
                    value={editForm.twitter}
                    onChange={(e) => setEditForm(prev => ({ ...prev, twitter: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="X (Twitter) URL"
                  />
                  {dev.id === "1" && (
                    <Input
                      value={editForm.youtube}
                      onChange={(e) => setEditForm(prev => ({ ...prev, youtube: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="YouTube URL"
                    />
                  )}
                  <div className="flex gap-1 justify-center mt-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSave(dev.id)}
                      className="h-8 px-3"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="h-8 px-3"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h5 className="font-semibold text-foreground mb-1 text-center">{dev.name}</h5>
                  <p className="text-sm text-muted-foreground mb-4 text-center">{dev.role}</p>
                  
                  {/* Social Media Links */}
                  <div className="flex justify-center gap-2 flex-wrap">
                    {dev.linkedin && (
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#0077b5] transition-colors p-1"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {dev.github && (
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {dev.instagram && (
                      <a
                        href={dev.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#E4405F] transition-colors p-1"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {dev.twitter && (
                      <a
                        href={dev.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#1DA1F2] transition-colors p-1"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {dev.id === "1" && dev.youtube && (
                      <a
                        href={dev.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#FF0000] transition-colors p-1"
                      >
                        <Youtube className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DeveloperTeam;
