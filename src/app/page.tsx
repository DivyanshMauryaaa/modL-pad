'use client'
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import supabase from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import DebugAuth from "@/components/debug-auth";

export default function Home() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projects, setProjects] = useState<any[]>([]);

  const addProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const { error } = await supabase.from('projects')
      .insert({
        user_id: user?.id,
        title: newProjectName.trim()
      });

    if (error) {
      toast.error("Failed to Add Project");
      return;
    }

    toast.success("Project added successfully!");
    setNewProjectName('');
    setOpen(false);
    fetchProjects();
  }

  const fetchProjects = async () => {
    if (!user?.id) return;

    const { error, data } = await supabase.from('projects')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to load Projects");
      return;
    }

    setProjects(data || []);
  }

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-semibold">Projects</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Add New Project</DialogTitle>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Name your Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <Button
                className="w-full hover:scale-110 cursor-pointer"
                onClick={addProject}
                disabled={!newProjectName.trim()}
              >
                Add Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link href={`/project/${project.id}`} key={project.id}>
            <Card key={project.id} className="hover:shadow-lg cursor-pointer transition-shadow">
              <CardContent className="px-4 py-3">
                <CardTitle className="mb-2 text-3xl">{project.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No projects yet. Create your first project!
        </div>
      )}
      {/* <DebugAuth /> */}
    </div>
  );
}
