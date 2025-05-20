// Basic Test Suite for Timetable GA

console.log("--- Starting Timetable GA Tests ---");

// Mock data (simplified versions of what getInputs would produce)
const mockCourses = ["Math", "Physics", "History"];
const mockTeachers = ["Dr. Alpha", "Prof. Beta"];
const mockRooms = [
    { name: "Room101", capacity: 30 },
    { name: "Room102", capacity: 25 }
];
const mockTimeSlots = ["Mon 9-10", "Mon 10-11", "Tue 9-10"];
const mockLecturesPerCourse = {
    "Math": 2,
    "Physics": 1,
    "History": 1
};
const mockInputs = {
    courses: mockCourses,
    teachers: mockTeachers,
    rooms: mockRooms,
    timeSlots: mockTimeSlots,
    lecturesPerCourse: mockLecturesPerCourse,
    populationSize: 10, // Smaller for tests
    generations: 5    // Smaller for tests
};

// Helper function for assertions
function assert(condition, message) {
    if (!condition) {
        console.error("Assertion Failed:", message);
    } else {
        console.log("Assertion Passed:", message);
    }
}

// Test 1: generateRandomTimetable
function testGenerateRandomTimetable() {
    console.log("--- Test: generateRandomTimetable ---");
    const timetable = generateRandomTimetable(mockCourses, mockTeachers, mockRooms, mockTimeSlots, mockLecturesPerCourse);
    
    assert(timetable !== null, "Timetable should not be null.");
    assert(Array.isArray(timetable), "Timetable should be an array.");
    
    let expectedLectureCount = 0;
    for (const course of mockCourses) {
        expectedLectureCount += mockLecturesPerCourse[course] || 0;
    }
    assert(timetable.length === expectedLectureCount, `Timetable should have ${expectedLectureCount} classes based on lecturesPerCourse. Got: ${timetable.length}`);

    if (timetable.length > 0) {
        const firstClass = timetable[0];
        assert(firstClass.hasOwnProperty('course'), "Class should have 'course' property.");
        assert(firstClass.hasOwnProperty('teacher'), "Class should have 'teacher' property.");
        assert(firstClass.hasOwnProperty('room'), "Class should have 'room' property.");
        assert(firstClass.hasOwnProperty('timeSlot'), "Class should have 'timeSlot' property.");
        assert(mockCourses.includes(firstClass.course), "Class course should be one of the mock courses.");
        assert(mockTeachers.includes(firstClass.teacher), "Class teacher should be one of the mock teachers.");
    }
    console.log("generateRandomTimetable test completed. Inspect timetable structure manually if needed:", timetable);
}

// Test 2: calculateFitness
function testCalculateFitness() {
    console.log("--- Test: calculateFitness ---");

    // Scenario 1: A "good" timetable (few conflicts, all lectures scheduled)
    // Note: Manually creating a perfect timetable is hard; this will likely have some "imperfections"
    // that the fitness function should score appropriately.
    const goodTimetable = [
        { course: "Math", teacher: "Dr. Alpha", room: mockRooms[0], timeSlot: "Mon 9-10" },
        { course: "Math", teacher: "Dr. Alpha", room: mockRooms[0], timeSlot: "Mon 10-11" }, // Different time
        { course: "Physics", teacher: "Prof. Beta", room: mockRooms[1], timeSlot: "Mon 9-10" },
        { course: "History", teacher: "Prof. Beta", room: mockRooms[1], timeSlot: "Tue 9-10" } // Different time
    ];
    // Ensure `lecturesPerCourse` matches this good timetable structure for accurate testing
    const fitness1 = calculateFitness(goodTimetable, mockRooms, mockCourses, mockLecturesPerCourse);
    assert(fitness1 > 500, `Fitness for 'good' timetable should be relatively high. Got: ${fitness1}`);
    console.log("Fitness (good timetable attempt):", fitness1);

    // Scenario 2: Teacher conflict
    const teacherConflictTimetable = [
        { course: "Math", teacher: "Dr. Alpha", room: mockRooms[0], timeSlot: "Mon 9-10" },
        { course: "Physics", teacher: "Dr. Alpha", room: mockRooms[1], timeSlot: "Mon 9-10" }, // Same teacher, same time
        { course: "Math", teacher: "Prof. Beta", room: mockRooms[0], timeSlot: "Mon 10-11" },
        { course: "History", teacher: "Prof. Beta", room: mockRooms[1], timeSlot: "Tue 9-10" }
    ];
    const fitness2 = calculateFitness(teacherConflictTimetable, mockRooms, mockCourses, mockLecturesPerCourse);
    assert(fitness2 < fitness1, `Fitness with teacher conflict (${fitness2}) should be less than without (${fitness1}).`);
    console.log("Fitness (teacher conflict):", fitness2);

    // Scenario 3: Room conflict
    const roomConflictTimetable = [
        { course: "Math", teacher: "Dr. Alpha", room: mockRooms[0], timeSlot: "Mon 9-10" },
        { course: "Physics", teacher: "Prof. Beta", room: mockRooms[0], timeSlot: "Mon 9-10" }, // Same room, same time
        { course: "Math", teacher: "Dr. Alpha", room: mockRooms[1], timeSlot: "Mon 10-11" },
        { course: "History", teacher: "Prof. Beta", room: mockRooms[1], timeSlot: "Tue 9-10" }
    ];
    const fitness3 = calculateFitness(roomConflictTimetable, mockRooms, mockCourses, mockLecturesPerCourse);
    assert(fitness3 < fitness1, `Fitness with room conflict (${fitness3}) should be less than without (${fitness1}).`);
    console.log("Fitness (room conflict):", fitness3);
    
    // Scenario 4: Incorrect number of lectures (e.g., Math missing one lecture)
     const missingLectureTimetable = [
        { course: "Math", teacher: "Dr. Alpha", room: mockRooms[0], timeSlot: "Mon 9-10" },
        // Math lecture at Mon 10-11 is missing
        { course: "Physics", teacher: "Prof. Beta", room: mockRooms[1], timeSlot: "Mon 9-10" },
        { course: "History", teacher: "Prof. Beta", room: mockRooms[1], timeSlot: "Tue 9-10" }
    ];
    const fitness4 = calculateFitness(missingLectureTimetable, mockRooms, mockCourses, mockLecturesPerCourse);
    assert(fitness4 < fitness1, `Fitness with missing lecture (${fitness4}) should be less than 'good' timetable (${fitness1}).`);
    console.log("Fitness (missing lecture):", fitness4);

    console.log("calculateFitness test completed.");
}

// Test 3: Crossover
function testCrossover() {
    console.log("--- Test: Crossover ---");
    const parent1 = [
        { course: "C1", teacher: "T1", room: mockRooms[0], timeSlot: "TS1" },
        { course: "C2", teacher: "T2", room: mockRooms[1], timeSlot: "TS2" }
    ];
    const parent2 = [
        { course: "C3", teacher: "T3", room: mockRooms[0], timeSlot: "TS3" },
        { course: "C4", teacher: "T4", room: mockRooms[1], timeSlot: "TS4" }
    ];
    
    const [offspring1, offspring2] = crossover(parent1, parent2);
    assert(offspring1.length === parent1.length, "Offspring 1 length should match parent length.");
    assert(offspring2.length === parent2.length, "Offspring 2 length should match parent length.");
    
    // Check if crossover point seems to have worked (at least one element different if parents are different)
    // This is a basic check; more detailed would compare specific elements.
    if (parent1.length > 0 && parent2.length > 0 && parent1[0].course !== parent2[0].course) {
         assert(offspring1[0].course === parent1[0].course || offspring1[0].course === parent2[0].course, "Offspring 1 first element course should come from a parent.");
    }
    console.log("Crossover test completed. Offspring1:", offspring1, "Offspring2:", offspring2);
}

// Test 4: Mutation
function testMutation() {
    console.log("--- Test: Mutation ---");
    const timetable = [
        { course: "Math", teacher: "Dr. Alpha", room: mockRooms[0], timeSlot: "Mon 9-10" },
        { course: "Physics", teacher: "Prof. Beta", room: mockRooms[1], timeSlot: "Mon 10-11" }
    ];
    // High mutation rate to ensure it likely happens for the test
    const mutatedTimetable = mutation(JSON.parse(JSON.stringify(timetable)), mockTeachers, mockRooms, mockTimeSlots, 1.0); 
    
    assert(mutatedTimetable.length === timetable.length, "Mutated timetable length should remain the same.");
    // It's hard to assert a specific change occurred without knowing the random outcome,
    // but we can check if it's structurally similar and potentially different.
    // A more robust test would involve checking if *at most one* element's property changed,
    // or running it many times and seeing a distribution of changes.
    let differences = 0;
    for(let i=0; i<timetable.length; i++) {
        if (timetable[i].teacher !== mutatedTimetable[i].teacher ||
            timetable[i].room.name !== mutatedTimetable[i].room.name ||
            timetable[i].timeSlot !== mutatedTimetable[i].timeSlot) {
            differences++;
        }
    }
    assert(differences <= 1, `Mutation should change at most one class details for this simple mutation. Found ${differences} differing classes.`);
    console.log("Mutation test completed. Original:", timetable, "Mutated:", mutatedTimetable);
}


// Function to run all tests
function runAllTests() {
    console.log("=== Running All GA Unit Tests ===");
    
    // Check if GA functions are available (they should be if script.js is loaded)
    if (typeof generateRandomTimetable !== 'function' || 
        typeof calculateFitness !== 'function' ||
        typeof crossover !== 'function' ||
        typeof mutation !== 'function') {
        console.error("GA functions not found. Make sure script.js is loaded before tests.js and functions are globally accessible if not using modules.");
        // Attempt to load script.js if running in a browser-like environment that supports it (won't work in Node directly this way)
        // This is a hack for simple browser testing. Proper modules would be better.
        if (typeof document !== 'undefined') { // Basic check if in a browser-like environment
            console.warn("Attempting to dynamically load script.js for tests. This is not a robust solution.");
            const scriptTag = document.createElement('script');
            scriptTag.src = 'script.js';
            scriptTag.onload = () => {
                console.log("script.js loaded dynamically. Please re-run runAllTests().");
                // Note: re-running automatically here might be tricky due to async load.
                // User might need to call runAllTests() again from console.
            };
            scriptTag.onerror = () => console.error("Failed to load script.js for tests.");
            document.head.appendChild(scriptTag);
            return; // Stop further execution until script is loaded
        } else {
            return; // Cannot proceed if functions are not found
        }
    }

    testGenerateRandomTimetable();
    testCalculateFitness();
    testCrossover();
    testMutation();
    console.log("=== GA Unit Tests Completed ===");
    console.log("NOTE: These tests are basic. Review console output carefully. For 'calculateFitness', 'good' timetable scores are relative.");
    console.log("To use these tests: 1. Load index.html in your browser. 2. Open developer console. 3. Ensure script.js is loaded. 4. Load tests.js (e.g., via <script src='tests.js'></script> in index.html or by pasting content into console). 5. Call runAllTests() from console.");
}

// Optional: Automatically run tests if a certain condition is met, or provide a button.
// For now, manual execution via runAllTests() from console is expected.
// To make it easier, you could add:
// document.addEventListener('DOMContentLoaded', () => {
//     const testButton = document.createElement('button');
//     testButton.textContent = 'Run GA Tests';
//     testButton.onclick = runAllTests;
//     document.body.appendChild(testButton); // Or place it more strategically
// });
// But this requires tests.js to be loaded by index.html.
// The user will be instructed to load and run tests from the console.
