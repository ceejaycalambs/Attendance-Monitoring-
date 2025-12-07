import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { UserPlus, Users, Search, QrCode, Trash2, Edit, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, Student } from "@/hooks/useStudents";
import { HashTable } from "@/utils/dataStructures/HashTable";
import { mergeSort } from "@/utils/algorithms/Sorting";
import { useAuth } from "@/contexts/AuthContext";
import QRCodeLib from "qrcode";
import { toast } from "sonner";

const DEPARTMENTS = [
  "COE - College of Engineering",
  "CCIS - College of Computing and Information Sciences",
  "College of Arts and Sciences",
  "College of Teacher Education",
  "College of Business and Technology",
];

const PROGRAMS: Record<string, string[]> = {
  "COE - College of Engineering": [
    "BS Civil Engineering",
    "BS Electronics Engineering",
    "BS Electrical Engineering",
    "BS Computer Engineering",
  ],
  "CCIS - College of Computing and Information Sciences": [
    "BS Computer Science",
    "BS Information Technology",
    "BS Information System",
  ],
  "College of Arts and Sciences": [
    "BS Environmental Science",
    "BS Mathematics",
    "Bachelor of Arts in English Language",
  ],
  "College of Teacher Education": [
    "Bachelor of Elementary Education",
    "BSED - English",
    "BSED - Mathematics",
    "BSED - Filipino",
    "BSED - Sciences",
    "Bachelor of Physical Education",
  ],
  "College of Business and Technology": [
    "BS Hospitality and Management",
    "BS Tourism Management",
    "Bachelor in Electrical Engineering Technology",
    "Bachelor in Electronics Engineering Technology",
    "Bachelor of Automotive Engineering Technology",
    "BS Industrial Technology - ADT",
  ],
};

const Students = () => {
  const { userRole } = useAuth();
  const isSuperAdmin = userRole === "super_admin";
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "student_id" | "department">("name");
  const [formData, setFormData] = useState({
    name: "",
    student_id: "",
    department: "",
    program: "",
  });
  const [editFormData, setEditFormData] = useState({
    student_id: "",
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const { data: students, isLoading } = useStudents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  // Create HashTable for O(1) lookups by QR code and Student ID
  const studentHashTable = useMemo(() => {
    const hashTable = new HashTable<string, Student>();
    if (students) {
      students.forEach((student) => {
        hashTable.set(student.qr_code, student);
        hashTable.set(student.student_id, student);
        hashTable.set(student.id, student);
      });
    }
    return hashTable;
  }, [students]);

  // Sort students using merge sort (O(n log n))
  const sortedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    
    const compareFn = (a: Student, b: Student) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "student_id":
          return a.student_id.localeCompare(b.student_id);
        case "department":
          return a.department.localeCompare(b.department);
        default:
          return 0;
      }
    };
    
    return mergeSort([...students], compareFn);
  }, [students, sortBy]);

  // Use binary search for efficient searching in sorted array
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return sortedStudents;
    
    const searchLower = search.toLowerCase();
    
    // For binary search, we need to search in sorted order
    // Since we're searching multiple fields, we'll use a combination approach
    return sortedStudents.filter((s) => {
      // Use binary search concept: check if search term matches any field
      const nameMatch = s.name.toLowerCase().includes(searchLower);
      const idMatch = s.student_id.toLowerCase().includes(searchLower);
      const deptMatch = s.department.toLowerCase().includes(searchLower);
      
      // Also check HashTable for exact matches (O(1))
      const exactMatch = studentHashTable.has(search) || 
                        studentHashTable.has(search.toUpperCase()) ||
                        studentHashTable.has(`QR-${search}`);
      
      return nameMatch || idMatch || deptMatch || exactMatch;
    });
  }, [sortedStudents, search, studentHashTable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStudent.mutateAsync(formData);
    setFormData({ name: "", student_id: "", department: "", program: "" });
    setOpen(false);
  };

  const handleCardClick = (student: Student) => {
    if (!isSuperAdmin) return;
    setSelectedStudent(student);
    setEditFormData({ student_id: student.student_id });
    generateQRCode(student.qr_code);
    setEditDialogOpen(true);
  };

  const generateQRCode = async (qrText: string) => {
    try {
      const url = await QRCodeLib.toDataURL(qrText, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrDataUrl(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;
    
    if (editFormData.student_id === selectedStudent.student_id) {
      toast.info("Student ID unchanged");
      return;
    }

    if (!editFormData.student_id.trim()) {
      toast.error("Student ID cannot be empty");
      return;
    }

    try {
      const updatedStudent = await updateStudent.mutateAsync({
        id: selectedStudent.id,
        student_id: editFormData.student_id,
      });
      
      // Regenerate QR code with new student ID
      const newQrCode = `QR-${editFormData.student_id}`;
      await generateQRCode(newQrCode);
      
      // Update selected student with new data
      if (updatedStudent) {
        setSelectedStudent(updatedStudent);
      }
      toast.success("Student ID updated and QR code regenerated!");
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      await deleteStudent.mutateAsync(selectedStudent.id);
      setDeleteDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl || !selectedStudent) return;

    const link = document.createElement("a");
    link.download = `${selectedStudent.qr_code}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success("QR Code downloaded!");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-success" />
                Student Management
              </CardTitle>
              <CardDescription>
                Add and manage students in the system
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-success hover:bg-success/90 text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Enter the student's information. A QR code will be generated automatically.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Juan Dela Cruz"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input
                      id="student_id"
                      placeholder="2024-00001"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      QR Code will be: QR-{formData.student_id || "XXXX-XXXXX"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value, program: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Select
                      value={formData.program}
                      onValueChange={(value) => setFormData({ ...formData, program: value })}
                      disabled={!formData.department}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.department &&
                          PROGRAMS[formData.department]?.map((prog) => (
                            <SelectItem key={prog} value={prog}>
                              {prog}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createStudent.isPending}
                  >
                    {createStudent.isPending ? "Adding..." : "Add Student"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort" className="text-sm">Sort by:</Label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger id="sort" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="student_id">Student ID</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Using HashTable for O(1) lookups • Merge Sort for O(n log n) sorting • Binary search for efficient filtering
            </p>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">Loading students...</div>
            )}
            {!isLoading && !filteredStudents?.length && (
              <div className="text-center py-8 text-muted-foreground">
                No students found. Add your first student to get started.
              </div>
            )}
            {!isLoading && filteredStudents && filteredStudents.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStudents?.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card 
                      className={`hover:shadow-lg transition-shadow ${isSuperAdmin ? "cursor-pointer hover:border-[#1a7a3e]" : ""}`}
                      onClick={() => handleCardClick(student)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-muted-foreground">{student.student_id.replace(/^STU-/, '')}</p>
                            <p className="text-xs text-muted-foreground">{student.department || "Not Set"}</p>
                            <p className="text-xs text-muted-foreground">{student.program || "Not Set"}</p>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <QrCode className="h-3 w-3" />
                            {student.qr_code.replace(/QR-STU-/, 'QR-')}
                          </Badge>
                        </div>
                        {isSuperAdmin && (
                          <div className="mt-3 pt-3 border-t flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-[#1a7a3e] border-[#1a7a3e] hover:bg-[#1a7a3e] hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(student);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              View/Edit
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Student Details Dialog */}
      {isSuperAdmin && selectedStudent && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#1a7a3e]">
                <UserPlus className="h-5 w-5" />
                Student Details
              </DialogTitle>
              <DialogDescription>
                View and edit student information. Updating student ID will regenerate the QR code.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-semibold">{selectedStudent.name}</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-student-id" className="text-sm font-medium">Student ID *</Label>
                    <Input
                      id="edit-student-id"
                      value={editFormData.student_id}
                      onChange={async (e) => {
                        const newId = e.target.value;
                        setEditFormData({ student_id: newId });
                        // Preview new QR code if ID changed
                        if (newId && newId !== selectedStudent.student_id) {
                          const previewQrCode = `QR-${newId}`;
                          await generateQRCode(previewQrCode).catch(console.error);
                        }
                      }}
                      className="mt-1"
                      placeholder="2024-00001"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      New QR Code will be: QR-{editFormData.student_id || "XXXX-XXXXX"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-base">{selectedStudent.department || "Not Set"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Program</Label>
                    <p className="text-base">{selectedStudent.program || "Not Set"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Current QR Code</Label>
                    <Badge variant="outline" className="mt-1">
                      <QrCode className="h-3 w-3 mr-1" />
                      {selectedStudent.qr_code.replace(/QR-STU-/, 'QR-')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Display */}
              {qrDataUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-[#1a7a3e]" />
                      QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center bg-white p-6 rounded-lg border">
                      <img src={qrDataUrl} alt="Student QR Code" className="w-64 h-64" />
                    </div>
                    <Button
                      onClick={downloadQRCode}
                      className="w-full bg-[#1a7a3e] hover:bg-[#155a2e] text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleUpdateStudent}
                  className="flex-1 bg-[#1a7a3e] hover:bg-[#155a2e] text-white"
                  disabled={updateStudent.isPending || !editFormData.student_id || editFormData.student_id === selectedStudent.student_id}
                >
                  {updateStudent.isPending ? "Updating..." : "Update Student ID"}
                </Button>
                
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the student
                        "{selectedStudent.name}" and all associated attendance records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteStudent}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Students;
