package com.bewize.demo;

// A student record. Using a typed record instead of a HashMap<String,Object> so the data
// has real fields and the compiler catches mistakes.
public record Student(int id, String fullName, String className, double averageGrade) {
}
