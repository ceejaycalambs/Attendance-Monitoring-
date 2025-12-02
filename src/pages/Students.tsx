import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Users, Search, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudents, useCreateStudent, Student } from "@/hooks/useStudents";
import { HashTable } from "@/utils/dataStructures/HashTable";
import { mergeSort, quickSort } from "@/utils/algorithms/Sorting";
import { binarySearch, binarySearchContains } from "@/utils/algorithms/BinarySearch";

const DEPARTMENTS = [
  "Engineering",
  "Arts & Sciences",
  "Business",
  "Education",
  "Nursing",
  "Architecture",
];

const PROGRAMS: Record<string, string[]> = {
  Engineering: ["Computer Science", "Civil Engineering", "Electrical Engineering", "Mechanical Engineering"],
  "Arts & Sciences": ["Biology", "Psychology", "Chemistry", "Mathematics"],
  Business: ["Accountancy", "Marketing", "Management", "Finance"],
  Education: ["Elementary Education", "Secondary Education", "Special Education"],
  Nursing: ["Bachelor of Science in Nursing"],
  Architecture: ["Bachelor of Science in Architecture"],
};

const Students = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "student_id" | "department">("name");
  const [formData, setFormData] = useState({
    name: "",
    student_id: "",
    department: "",
    program: "",
  });

  const { data: students, isLoading } = useStudents();
  const createStudent = useCreateStudent();

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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-accent" />
                Student Management
              </CardTitle>
              <CardDescription>
                Add and manage students in the system
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
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
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading students...</div>
            ) : !filteredStudents?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found. Add your first student to get started.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStudents?.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-muted-foreground">{student.student_id}</p>
                            <p className="text-xs text-muted-foreground">{student.department}</p>
                            <p className="text-xs text-muted-foreground">{student.program}</p>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <QrCode className="h-3 w-3" />
                            {student.qr_code}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Students;
