'use client';

import { useState } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { 
  Search, 
  Play, 
  Clock, 
  BookOpen, 
  Video, 
  Globe, 
  FileText,
  Filter,
  Grid3X3,
  List,
  ArrowLeft,
  Plus
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "~/components/ThemeToggle";
import LoginButton from "~/components/LoginLogOutButton";
import DifficultyDialog from "~/components/DifficultyDialog";
import { type ContentType } from "~/components/ContentUploader";

// Mock data - in real app this would come from your backend
interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  rating: number;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  contentType: ContentType;
  progress?: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Introduction to Machine Learning',
    description: 'Learn the fundamentals of ML with hands-on projects and real-world applications.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
    duration: '12h 30m',
    rating: 4.8,
    category: 'Data Science',
    level: 'Beginner',
    contentType: 'pdf-file',
    progress: 65,
    isFeatured: true
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts including hooks, context, and performance optimization.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    duration: '8h 45m',
    rating: 4.9,
    category: 'Web Development',
    level: 'Advanced',
    contentType: 'youtube',
    progress: 23,
    isNew: true
  },
  {
    id: '3',
    title: 'Digital Marketing Fundamentals',
    description: 'Complete guide to digital marketing strategies and tools for modern businesses.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    duration: '6h 15m',
    rating: 4.6,
    category: 'Marketing',
    level: 'Beginner',
    contentType: 'website',
    isNew: true
  },
  {
    id: '4',
    title: 'Financial Analysis with Python',
    description: 'Learn to analyze financial data and build trading strategies using Python.',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop',
    duration: '15h 20m',
    rating: 4.7,
    category: 'Finance',
    level: 'Intermediate',
    contentType: 'pdf-file',
    progress: 0
  },
  {
    id: '5',
    title: 'UX Design Principles',
    description: 'Master the principles of user experience design and create intuitive interfaces.',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop',
    duration: '9h 30m',
    rating: 4.8,
    category: 'Design',
    level: 'Intermediate',
    contentType: 'youtube',
    progress: 45,
    isFeatured: true
  },
  {
    id: '6',
    title: 'Blockchain Development',
    description: 'Build decentralized applications and smart contracts on the blockchain.',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop',
    duration: '20h 15m',
    rating: 4.5,
    category: 'Blockchain',
    level: 'Advanced',
    contentType: 'pdf-link',
    progress: 12
  }
];

const CATEGORIES = ['All', 'Data Science', 'Web Development', 'Marketing', 'Finance', 'Design', 'Blockchain'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function LibraryClient() {
  const [courses] = useState<Course[]>(MOCK_COURSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [difficultyDialogOpen, setDifficultyDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Group courses for Netflix-style sections
  const featuredCourses = filteredCourses.filter(course => course.isFeatured);
  const newCourses = filteredCourses.filter(course => course.isNew);
  const allCourses = filteredCourses;

  const getContentTypeIcon = (contentType: ContentType) => {
    switch (contentType) {
      case 'pdf-file':
      case 'pdf-link':
        return <FileText className="h-4 w-4" />;
      case 'youtube':
        return <Video className="h-4 w-4" />;
      case 'website':
        return <Globe className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setDifficultyDialogOpen(true);
  };

  const CourseCard = ({ course, isLarge = false }: { course: Course; isLarge?: boolean }) => (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
        isLarge ? 'col-span-2 row-span-2' : ''
      }`}
      onClick={() => handleCourseClick(course)}
    >
      <div className="relative overflow-hidden rounded-t-lg">
        <Image 
          src={course.thumbnail} 
          alt={course.title}
          width={400}
          height={isLarge ? 256 : 192}
          className={`w-full object-cover transition-transform duration-300 group-hover:scale-110 ${
            isLarge ? 'h-64' : 'h-48'
          }`}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        <div className="absolute top-2 right-2 flex gap-2">
          {course.isNew && <Badge className="bg-red-600 text-white">New</Badge>}
          {course.isFeatured && <Badge className="bg-yellow-600 text-white">Featured</Badge>}
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {getContentTypeIcon(course.contentType)}
            <span className="text-xs">{course.contentType.replace('-', ' ')}</span>
          </Badge>
        </div>
        {course.progress !== undefined && course.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div 
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        )}
        <Button 
          size="icon" 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <Play className="h-6 w-6" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className={`line-clamp-2 ${isLarge ? 'text-xl' : 'text-lg'}`}>
            {course.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className={`text-muted-foreground mb-3 ${isLarge ? 'line-clamp-3' : 'line-clamp-2'}`}>
          {course.description}
        </p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
            <Badge variant="outline">{course.level}</Badge>
          </div>
          <Badge variant="outline">{course.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );

  const CourseRow = ({ title, courses, showViewAll = true }: { 
    title: string; 
    courses: Course[]; 
    showViewAll?: boolean;
  }) => (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {showViewAll && courses.length > 4 && (
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            View All
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
          {courses.slice(0, 8).map((course, index) => (
            <div 
              key={course.id} 
              className={`flex-shrink-0 ${
                index === 0 && title === 'Featured' ? 'w-96' : 'w-72'
              }`}
            >
              <CourseCard course={course} isLarge={index === 0 && title === 'Featured'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <div className="h-8 w-8 rounded-lg bg-foreground"></div>
              <span className="text-xl font-bold">Vibe Learning</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/library" className="text-foreground font-medium">
                Library
              </Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Learning Library
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover, learn, and master new skills with our comprehensive course collection
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  size="icon"
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
                <Button asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Course
                  </Link>
                </Button>
              </div>
            </div>

            {/* Filter Controls */}
            {showFilters && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Level</label>
                    <select 
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      {LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Course Sections */}
      <main className="container mx-auto px-6 py-8">
        {featuredCourses.length > 0 && (
          <CourseRow title="Featured" courses={featuredCourses} />
        )}
        
        {newCourses.length > 0 && (
          <CourseRow title="New Releases" courses={newCourses} />
        )}
        
        {/* All Courses in Grid/List View */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">All Courses</h2>
            <div className="text-sm text-muted-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </div>
          </div>
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {allCourses.map((course) => (
                <Card key={course.id} className="flex flex-row overflow-hidden">
                  <div className="w-48 flex-shrink-0">
                    <Image 
                      src={course.thumbnail} 
                      alt={course.title}
                      width={192}
                      height={108}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">{course.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration}</span>
                        </div>
                        <Badge variant="outline">{course.level}</Badge>
                        <Badge variant="outline">{course.category}</Badge>
                      </div>
                      <Button>
                        Start Learning
                      </Button>
                    </div>
                    {course.progress !== undefined && course.progress > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </main>

      {/* Difficulty Dialog */}
      {selectedCourse && (
        <DifficultyDialog
          isOpen={difficultyDialogOpen}
          onClose={() => {
            setDifficultyDialogOpen(false);
            setSelectedCourse(null);
          }}
          courseTitle={selectedCourse.title}
        />
      )}
    </div>
  );
}
