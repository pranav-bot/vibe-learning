import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import LoginButton from "~/components/LoginLogOutButton";

export default async function Dashboard() {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between px-6 py-8">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <Link href="/" className="text-2xl font-bold text-white">Vibe Learning</Link>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {user.email}</span>
          <LoginButton />
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-xl text-gray-300">Upload your PDF documents to start learning</p>
        </div>

        {/* Upload PDF Section */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                Upload PDF Document
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* Drag & Drop Zone */}
              <div className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center hover:border-white/50 transition-colors cursor-pointer">
                <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Drag and drop your PDF here
                </h3>
                <p className="text-gray-300 mb-4">
                  or click to browse files
                </p>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Select PDF File
                </Button>
                <p className="text-sm text-gray-400 mt-3">
                  Supports PDF files up to 50MB
                </p>
              </div>

              {/* File Requirements */}
              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium mb-2">Supported formats:</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• PDF documents (.pdf)</li>
                  <li>• Maximum file size: 50MB</li>
                  <li>• Text-based PDFs work best for AI analysis</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
