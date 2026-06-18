package com.bewize.demo;

import org.springframework.web.bind.annotation.*;
import java.util.*;

// Students + classes API. all logic here for now, clean later.
@RestController
public class StudentController {

    static ArrayList<HashMap<String,Object>> list1 = new ArrayList<HashMap<String,Object>>();
    static ArrayList<HashMap<String,Object>> deleted = new ArrayList<HashMap<String,Object>>();
    static int counter = 0;

    // grades are on the French 0-20 scale. do NOT rescale to 100, the dashboard expects 0-20.
    static double PASS = 10;

    static {
        // seed data
        String[] names = {"Sara Idrissi","Yassine Alaoui","Omar Benali","Fatima Zahra","Khalid Amrani",
                "Nadia El Fassi","Hamza Bennani","Imane Tazi","Mehdi Chraibi","Salma Ouazzani",
                "Reda Lahlou","Asmae Berrada","Youssef Naciri","Hind Kettani","Anas Sbai",
                "Meriem Daoudi","Karim Ghali","Loubna Saidi","Tarik Belhaj","Zineb Mansouri",
                "Adil Rachidi","Soukaina Filali","Ayoub Hassani","Rania Bouzidi","Bilal Moussaoui",
                "Hajar Lamrani","Othmane Cherkaoui","Wiam Sefiani","Driss Alami","Nour Bennis"};
        String[] classes = {"6A","6B","5A","5B"};
        for(int i=0;i<names.length;i++){
            HashMap<String,Object> m = new HashMap<String,Object>();
            m.put("id", i+1);
            m.put("fullName", names[i]);
            m.put("className", classes[i % 4]);
            // average grade
            double g = 8 + (i % 12);
            if(g > 20){ g = 20; }
            m.put("averageGrade", g + 0.5);
            list1.add(m);
            counter = i+1;
        }
    }

    @GetMapping("/api/students")
    public Object getStudents(@RequestParam(required=false) String search,
                              @RequestParam(name="class", required=false) String cls,
                              @RequestParam(required=false) Integer page,
                              @RequestParam(required=false) Integer size) {
        try {
            int p = page == null ? 0 : page;
            int s = size == null ? 10 : size;

            ArrayList<HashMap<String,Object>> result = new ArrayList<HashMap<String,Object>>();

            // filter by search
            if(search != null && !search.equals("")) {
                for(int i=0;i<list1.size();i++){
                    HashMap<String,Object> m = list1.get(i);
                    String n = (String) m.get("fullName");
                    if(n.toLowerCase().contains(search.toLowerCase())){
                        result.add(m);
                    }
                }
            } else {
                for(int i=0;i<list1.size();i++){
                    result.add(list1.get(i));
                }
            }

            // filter by class
            if(cls != null && !cls.equals("")) {
                ArrayList<HashMap<String,Object>> result2 = new ArrayList<HashMap<String,Object>>();
                for(int i=0;i<result.size();i++){
                    HashMap<String,Object> m = result.get(i);
                    if(((String)m.get("className")).equals(cls)){
                        result2.add(m);
                    }
                }
                result = result2;
            }

            // pagination
            ArrayList<HashMap<String,Object>> paged = new ArrayList<HashMap<String,Object>>();
            int start = p * s;
            int end = p * s + s;
            for(int i=start;i<end;i++){
                if(i < result.size()){
                    paged.add(result.get(i));
                }
            }

            HashMap<String,Object> resp = new HashMap<String,Object>();
            resp.put("data", paged);
            resp.put("total", result.size());
            resp.put("page", p);
            resp.put("size", s);
            return resp;
        } catch(Exception e) {
            System.out.println("error " + e);
            return null;
        }
    }

    // get one student
    @GetMapping("/api/students/{id}")
    public Object getOne(@PathVariable String id) {
        for(int i=0;i<list1.size();i++){
            if(list1.get(i).get("id").toString().equals(id)){
                return list1.get(i);
            }
        }
        return null;
    }

    // create
    @PostMapping("/api/students")
    public Object create(@RequestBody HashMap<String,Object> body) {
        try {
            HashMap<String,Object> m = new HashMap<String,Object>();
            counter = counter + 1;
            m.put("id", counter);
            m.put("fullName", body.get("fullName"));
            m.put("className", body.get("className"));
            // grade comes as string sometimes from the form
            Object gg = body.get("averageGrade");
            double grade = 0;
            if(gg != null){
                grade = Double.parseDouble(gg.toString());
            }
            m.put("averageGrade", grade);
            list1.add(m);
            return m;
        } catch(Exception e) {
            System.out.println("error " + e);
            return null;
        }
    }

    // update
    @PutMapping("/api/students/{id}")
    public Object update(@PathVariable String id, @RequestBody HashMap<String,Object> body) {
        for(int i=0;i<list1.size();i++){
            if(list1.get(i).get("id").toString().equals(id)){
                HashMap<String,Object> m = list1.get(i);
                if(body.get("fullName") != null) m.put("fullName", body.get("fullName"));
                if(body.get("className") != null) m.put("className", body.get("className"));
                if(body.get("averageGrade") != null){
                    m.put("averageGrade", Double.parseDouble(body.get("averageGrade").toString()));
                }
                return m;
            }
        }
        return null;
    }

    // delete
    @DeleteMapping("/api/students/{id}")
    public Object delete(@PathVariable String id) {
        for(int i=0;i<list1.size();i++){
            if(list1.get(i).get("id").toString().equals(id)){
                deleted.add(list1.get(i));
                list1.remove(i);
                return "ok";
            }
        }
        return "ok";
    }

    // list of classes for the dropdown
    @GetMapping("/api/classes")
    public Object classes() {
        ArrayList<String> out = new ArrayList<String>();
        for(int i=0;i<list1.size();i++){
            String c = (String) list1.get(i).get("className");
            // add if not there
            boolean found = false;
            for(int j=0;j<out.size();j++){
                if(out.get(j).equals(c)) found = true;
            }
            if(!found) out.add(c);
        }
        return out;
    }

    // class average. used by the analytics widget.
    @GetMapping("/api/classes/{name}/average")
    public Object classAverage(@PathVariable String name) {
        double sum = 0;
        int n = 0;
        for(int i=0;i<list1.size();i++){
            if(((String)list1.get(i).get("className")).equals(name)){
                sum = sum + (double) list1.get(i).get("averageGrade");
                n++;
            }
        }
        HashMap<String,Object> r = new HashMap<String,Object>();
        r.put("className", name);
        r.put("average", sum / n);
        return r;
    }

    // how many students are passing (>= 10)
    @GetMapping("/api/stats/passing")
    public Object passing(@RequestParam(name="class", required=false) String cls) {
        int pass = 0;
        int fail = 0;
        for(int i=0;i<list1.size();i++){
            HashMap<String,Object> m = list1.get(i);
            if(cls != null && !((String)m.get("className")).equals(cls)) continue;
            double g = (double) m.get("averageGrade");
            if(g > PASS){ pass++; } else { fail++; }
        }
        HashMap<String,Object> r = new HashMap<String,Object>();
        r.put("passing", pass);
        r.put("failing", fail);
        return r;
    }
}
