package com.bewize.demo;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StudentController {

    // In-memory store. Resets when the app restarts; fine for this demo, a real app would use a DB.
    private static final List<Student> students = new ArrayList<>();
    private static int counter = 0;

    // Grades are on the French 0-20 scale. Passing is 10 or above.
    private static final double PASS_MARK = 10.0;
    private static final double MIN_GRADE = 0.0;
    private static final double MAX_GRADE = 20.0;

    static {
        String[] names = {"Sara Idrissi", "Yassine Alaoui", "Omar Benali", "Fatima Zahra", "Khalid Amrani",
                "Nadia El Fassi", "Hamza Bennani", "Imane Tazi", "Mehdi Chraibi", "Salma Ouazzani",
                "Reda Lahlou", "Asmae Berrada", "Youssef Naciri", "Hind Kettani", "Anas Sbai",
                "Meriem Daoudi", "Karim Ghali", "Loubna Saidi", "Tarik Belhaj", "Zineb Mansouri",
                "Adil Rachidi", "Soukaina Filali", "Ayoub Hassani", "Rania Bouzidi", "Bilal Moussaoui",
                "Hajar Lamrani", "Othmane Cherkaoui", "Wiam Sefiani", "Driss Alami", "Nour Bennis"};
        String[] classes = {"6A", "6B", "5A", "5B"};
        for (int i = 0; i < names.length; i++) {
            double grade = 8 + (i % 12) + 0.5;
            students.add(new Student(i + 1, names[i], classes[i % 4], grade));
        }
        counter = names.length;
    }

    @GetMapping("/students")
    public Map<String, Object> getStudents(@RequestParam(required = false) String search,
                                           @RequestParam(name = "class", required = false) String className,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        if (page < 0) page = 0;
        if (size <= 0) size = 10;

        List<Student> filtered = new ArrayList<>();
        for (Student s : students) {
            if (matchesSearch(s, search) && matchesClass(s, className)) {
                filtered.add(s);
            }
        }

        // Pagination, clamped so an out-of-range page just returns an empty list instead of throwing.
        int from = Math.min(page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());
        List<Student> pageItems = new ArrayList<>(filtered.subList(from, to));

        Map<String, Object> response = new HashMap<>();
        response.put("data", pageItems);
        response.put("total", filtered.size());
        response.put("page", page);
        response.put("size", size);
        return response;
    }

    @GetMapping("/students/{id}")
    public Student getOne(@PathVariable int id) {
        for (Student s : students) {
            if (s.id() == id) return s;
        }
        return null;
    }

    @PostMapping("/students")
    public Student create(@RequestBody Map<String, Object> body) {
        String fullName = requireText(body.get("fullName"), "fullName");
        String className = requireText(body.get("className"), "className");
        double grade = parseGrade(body.get("averageGrade"));

        counter++;
        Student student = new Student(counter, fullName, className, grade);
        students.add(student);
        return student;
    }

    @PutMapping("/students/{id}")
    public Student update(@PathVariable int id, @RequestBody Map<String, Object> body) {
        for (int i = 0; i < students.size(); i++) {
            Student current = students.get(i);
            if (current.id() == id) {
                String fullName = body.containsKey("fullName") ? requireText(body.get("fullName"), "fullName") : current.fullName();
                String className = body.containsKey("className") ? requireText(body.get("className"), "className") : current.className();
                double grade = body.containsKey("averageGrade") ? parseGrade(body.get("averageGrade")) : current.averageGrade();

                Student updated = new Student(id, fullName, className, grade);
                students.set(i, updated);
                return updated;
            }
        }
        return null;
    }

    @DeleteMapping("/students/{id}")
    public String delete(@PathVariable int id) {
        students.removeIf(s -> s.id() == id);
        return "ok";
    }

    @GetMapping("/classes")
    public List<String> classes() {
        List<String> result = new ArrayList<>();
        for (Student s : students) {
            if (!result.contains(s.className())) {
                result.add(s.className());
            }
        }
        return result;
    }

    @GetMapping("/classes/{name}/average")
    public Map<String, Object> classAverage(@PathVariable String name) {
        double sum = 0;
        int count = 0;
        for (Student s : students) {
            if (s.className().equals(name)) {
                sum += s.averageGrade();
                count++;
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("className", name);
        result.put("average", count == 0 ? 0 : sum / count);
        return result;
    }

    @GetMapping("/stats/passing")
    public Map<String, Object> passing(@RequestParam(name = "class", required = false) String className) {
        int passing = 0;
        int failing = 0;
        for (Student s : students) {
            if (className != null && !s.className().equals(className)) {
                continue;
            }
            if (s.averageGrade() >= PASS_MARK) {
                passing++;
            } else {
                failing++;
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("passing", passing);
        result.put("failing", failing);
        return result;
    }

    // --- helpers ---

    private static boolean matchesSearch(Student s, String search) {
        if (search == null || search.isBlank()) return true;
        return s.fullName().toLowerCase().contains(search.toLowerCase());
    }

    private static boolean matchesClass(Student s, String className) {
        if (className == null || className.isBlank()) return true;
        return s.className().equals(className);
    }

    private static String requireText(Object value, String field) {
        if (value == null || value.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.toString().trim();
    }

    private static double parseGrade(Object value) {
        if (value == null || value.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "averageGrade is required");
        }
        double grade;
        try {
            grade = Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "averageGrade must be a number");
        }
        if (grade < MIN_GRADE || grade > MAX_GRADE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "averageGrade must be between 0 and 20");
        }
        return grade;
    }
}
