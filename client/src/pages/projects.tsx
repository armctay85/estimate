import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Calendar, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

export default function Projects() {
  const [, setLocation] = useLocation();

  // Placeholder project data
  const projects = [
    {
      id: 1,
      name: "Kmart Gladstone Renovation",
      status: "In Progress",
      cost: 1245000,
      date: "2025-01-10",
      completion: 65
    },
    {
      id: 2,
      name: "Starbucks Drive-Through",
      status: "Planning",
      cost: 780000,
      date: "2025-01-08",
      completion: 20
    },
    {
      id: 3,
      name: "Residential Complex - Brisbane",
      status: "Completed",
      cost: 3400000,
      date: "2024-12-15",
      completion: 100
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage all your construction projects</p>
          </div>
          <Button 
            onClick={() => setLocation("/")}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{project.name}</span>
                  <FolderOpen className="w-5 h-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    project.status === 'Completed' ? 'text-green-600' :
                    project.status === 'In Progress' ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {project.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Estimated Cost:
                  </span>
                  <span className="font-medium">
                    ${project.cost.toLocaleString('en-AU')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Last Updated:
                  </span>
                  <span className="font-medium">
                    {new Date(project.date).toLocaleDateString('en-AU')}
                  </span>
                </div>

                <div className="pt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{project.completion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.completion}%` }}
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => setLocation("/")}
                >
                  Open Project
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}