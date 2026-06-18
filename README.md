# Students feature

Small app to list, search and filter students. React frontend, Spring Boot backend.

This is my version of the original code.

## How to run it

Running with Java 17+ and Node installed.

Backend (runs on port 8080):

```
cd backend
mvnw.cmd spring-boot:run
```

Frontend (runs on port 5173):

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in the browser.

## What it does

- List students, with pagination
- Search by name
- Filter by class
- Add, edit, delete a student
- Shows how many are passing vs failing

Grades are on the 0 to 20 scale. Passing is 10 or above.

## A note on setup

The project came as just two files (the controller and App.jsx) with nothing to actually run
it. So first I added the build setup. Backend I generated with Spring Initializr and dropped the
existing files in. Frontend is a normal Vite + React setup around the existing App.jsx. I
also added a small CORS config so the frontend can reach the backend in dev. I kept this in its
own commit and didn't change any of the actual logic.

## Bugs found

1. Saving a new or edited student fails silently or is blocked when the input is bad, with no message to the user.
   The grade field accepts anything. 
   during creation, if the input is incorrect, the user is not allowed to press the create button, but without any errors explaining the issue
   but during editing the user can input anything and save it, the save fails silently if the input is not fitting.

2. Pagination has no limits, both directions.
   
3. Search only looks at the current page, and also resets at class selection. Changing page also
   drops the active class/search filter (paging refetches the full unfiltered list).

4. The backend hides errors 
   A couple of endpoints catch every exception, print it, and return null

5. Deleting a student doesn't update the passing/failing counts or the total until you refresh.

6. The table uses the row's position as its React key instead of the student id.

7. The passing/failing count is off at the boundary. The backend only counts a grade above 10 as
   passing, but passing is meant to be 10 or above, so exactly 10 is wrongly counted as failing.
   It also disagrees with the table, which only marks a row red when the grade is below 10.

Smaller things I'm also cleaning up:
- Leftover console.log lines all over the place.
- The table HTML is badly done (rows sit directly inside the table, headers use td instead of th).
- Adding a confirmation before deleting a student.

## Decisions

How I'm fixing each bug above:

1. Validate the input on the backend and make sure the user gets told what's wrong.

2. Use the total count the backend already returns to work out the last page, and stop Prev/Next at the ends

3. Move search to the backend so it searches every student, not just the current page, and so it
   works together with the class filter and pagination. Drop the browser-side filtering.

4. Let errors come back as proper status codes

5. Refresh the stats and the list after a delete so the counts are right without a manual refresh.

6. Use the student id as the React key instead of the row position.

7. Change the passing check to grade >= 10 so it matches the rule and the table.

Bigger refactor calls:
- Backend stores each student as a HashMap<String,Object>, so everything is stringly-typed with
  casts everywhere. Plan: a proper Student class so the data is typed and validation has a home.
- Frontend repeats the http://localhost:8080 URL in about ten places. Plan: put it in one spot.

- There are two backend endpoints the frontend never calls: "get one student"
  (GET /api/students/{id}) and "class average" (/api/classes/{name}/average). The class average one
  also divides by zero if a class has no students. Since they're unused and removing an endpoint is
  really a product call, I don't want to silently delete them. So i plan to leave them for now and ask how you'd like them handled.

## What I'd do with more time

- Actually use the two unused features: show a class-average widget on the page, and a single, student view using the get-one endpoint.
- Let the user choose how many rows to show per page.
- Cleaner validation: a typed request object with standard annotations instead of the manual checks, I have now.
- Automated tests for the backend endpoints and the main frontend behaviour, so the fixes don't silently break later.
- A real database instead of the in-memory list (right now the data resets every time the backend restarts).
