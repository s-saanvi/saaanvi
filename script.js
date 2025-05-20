document.addEventListener('DOMContentLoaded', () => {
    // Element getters
    const coursesInput = document.getElementById('courses');
    const teachersInput = document.getElementById('teachers');
    const roomsInput = document.getElementById('rooms');
    const classLecturesInput = document.getElementById('classLectures');
    const timeSlotsInput = document.getElementById('timeSlots');
    const populationSizeInput = document.getElementById('populationSize');
    const generationsInput = document.getElementById('generations');
    const generateButton = document.getElementById('generateButton');
    const timetableDisplay = document.getElementById('timetable-display');

    // Updated generateButton event listener
    generateButton.addEventListener('click', () => {
        const inputs = getInputs();
        if (!inputs) {
            timetableDisplay.innerHTML = '<p style="color: red;">Please correct the input errors.</p>';
            return; // Validation failed in getInputs
        }

        // Clear previous results and show a loading message
        timetableDisplay.innerHTML = '<p>Generating timetable... This may take a few moments.</p>';
        
        // Run the GA (defer to allow UI update)
        setTimeout(() => {
            try {
                const bestTimetable = runGeneticAlgorithm(inputs);
                if (bestTimetable && bestTimetable.length > 0) {
                    displayTimetable(bestTimetable, inputs.timeSlots);
                } else {
                    timetableDisplay.innerHTML = '<p>Could not generate a valid timetable with the given constraints and parameters. Try adjusting inputs or GA parameters (e.g., more generations, larger population).</p>';
                }
            } catch (error) {
                console.error("Error during timetable generation:", error);
                timetableDisplay.innerHTML = `<p style="color: red;">An error occurred: ${error.message}. Check console for details.</p>`;
            }
        }, 10); // Small timeout to allow the "Generating..." message to display
    });

    // getInputs function (from existing code)
    function getInputs() {
        const courses = coursesInput.value.split(',').map(s => s.trim()).filter(s => s);
        const teachers = teachersInput.value.split(',').map(s => s.trim()).filter(s => s);
        const timeSlots = timeSlotsInput.value.split(',').map(s => s.trim()).filter(s => s);

        const roomsData = roomsInput.value.split(',').map(s => s.trim()).filter(s => s);
        const rooms = roomsData.map(roomStr => {
            const [name, capacityStr] = roomStr.split(':');
            if (!name || !capacityStr || isNaN(parseInt(capacityStr))) {
                alert(`Invalid room format: ${roomStr}. Use Name:Capacity.`);
                return null;
            }
            return { name: name.trim(), capacity: parseInt(capacityStr) };
        }).filter(r => r);

        const lecturesData = classLecturesInput.value.split(',').map(s => s.trim()).filter(s => s);
        const lecturesPerCourse = {};
        for (const lectureStr of lecturesData) {
            const [course, numLecturesStr] = lectureStr.split('=');
            if (!course || !numLecturesStr || isNaN(parseInt(numLecturesStr))) {
                alert(`Invalid lectures format: ${lectureStr}. Use CourseName=NumberOfLectures.`);
                return null;
            }
            lecturesPerCourse[course.trim()] = parseInt(numLecturesStr);
        }
        
        if (courses.length === 0 || teachers.length === 0 || rooms.length === 0 || timeSlots.length === 0 || Object.keys(lecturesPerCourse).length === 0) {
            alert("Please fill in all input fields: Courses, Teachers, Rooms, Lectures per course, and Time Slots.");
            return null;
        }
        if (rooms.length !== roomsData.length) {
             alert("Please correct room format errors.");
             return null;
        }
         if (Object.keys(lecturesPerCourse).length !== lecturesData.length) {
             alert("Please correct lectures per course format errors.");
             return null;
        }
        for (const course in lecturesPerCourse) {
            if (!courses.includes(course)) {
                alert(`Course "${course}" in "Lectures per course" is not defined in the main Courses list.`);
                return null;
            }
        }

        return {
            courses,
            teachers,
            rooms,
            lecturesPerCourse,
            timeSlots,
            populationSize: parseInt(populationSizeInput.value),
            generations: parseInt(generationsInput.value)
        };
    }

    // displayTimetable function (from existing code)
    function displayTimetable(timetable, timeSlots) {
        timetableDisplay.innerHTML = ''; 

        if (!timetable || timetable.length === 0) { 
            timetableDisplay.innerHTML = '<p>Timetable will be displayed here once generated. If you see this after generation, it means no valid schedule was found.</p>';
            if (!timetable && timeSlots && timeSlots.length > 0) { // If timetable is null but timeslots exist, show basic grid
                const table = document.createElement('table');
                const headerRow = table.insertRow();
                const th = document.createElement('th');
                th.textContent = 'Time Slot';
                headerRow.appendChild(th);
                const th2 = document.createElement('th');
                th2.textContent = 'Activity (Example)'; 
                headerRow.appendChild(th2);
                timeSlots.forEach(slot => {
                    const row = table.insertRow();
                    const cellTime = row.insertCell();
                    cellTime.textContent = slot;
                    const cellActivity = row.insertCell();
                    cellActivity.textContent = '---'; 
                });
                timetableDisplay.appendChild(table);
            }
            return;
        }
        
        const table = document.createElement('table');
        const headerRow = table.insertRow();
        ['Time Slot', 'Course', 'Teacher', 'Room'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        timetable.forEach(event => {
            const row = table.insertRow();
            row.insertCell().textContent = event.timeSlot;
            row.insertCell().textContent = event.course;
            row.insertCell().textContent = event.teacher;
            row.insertCell().textContent = event.room.name; 
        });
        timetableDisplay.appendChild(table);
    }

    // --- Genetic Algorithm Core Logic ---
    function generateRandomTimetable(courses, teachers, rooms, timeSlots, lecturesPerCourse) {
        const timetable = [];
        for (const course of courses) {
            const numLectures = lecturesPerCourse[course] || 1;
            for (let i = 0; i < numLectures; i++) {
                if (teachers.length === 0 || rooms.length === 0 || timeSlots.length === 0) {
                    console.warn("Not enough teachers, rooms, or time slots to schedule all classes.");
                    break; 
                }
                const teacher = teachers[Math.floor(Math.random() * teachers.length)];
                const room = rooms[Math.floor(Math.random() * rooms.length)];
                const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
                timetable.push({ course, teacher, room, timeSlot });
            }
        }
        return timetable;
    }

    function initializePopulation(populationSize, courses, teachers, rooms, timeSlots, lecturesPerCourse) {
        const population = [];
        for (let i = 0; i < populationSize; i++) {
            population.push(generateRandomTimetable(courses, teachers, rooms, timeSlots, lecturesPerCourse));
        }
        return population;
    }

function calculateFitness(timetable, rooms, courses, lecturesPerCourse) {
    let fitness = 1000; // Starting fitness score
    const PENALTY_HEAVY = 100;
    const PENALTY_MEDIUM = 50;
    const PENALTY_LIGHT = 10;

    // Count scheduled lectures for each course in the current timetable
    const scheduledLectures = {};
    courses.forEach(course => scheduledLectures[course] = 0);
    timetable.forEach(cls => {
        if (scheduledLectures[cls.course] !== undefined) {
            scheduledLectures[cls.course]++;
        }
        // Penalize if a class for a non-existent course is in the timetable (shouldn't happen with proper generation/mutation)
        else {
            fitness -= PENALTY_HEAVY; 
        }
    });

    // Constraint 1: Correct number of lectures per course
    for (const course of courses) {
        const required = lecturesPerCourse[course] || 0; // Default to 0 if not in lecturesPerCourse for some reason
        const scheduled = scheduledLectures[course];
        if (required !== scheduled) {
            fitness -= PENALTY_HEAVY * Math.abs(required - scheduled); // Penalize based on deviation
        }
    }

    // Hard Constraints (checking each class against others)
    for (let i = 0; i < timetable.length; i++) {
        const classA = timetable[i];

        // Constraint 2: Room capacity
        // This still uses an assumed class size. A more advanced version would need per-course enrollment.
        const assumedClassSize = 25; // Placeholder: Ideal input would be course.enrollment
        if (!classA.room || classA.room.capacity === undefined) {
             fitness -= PENALTY_LIGHT; // Penalize if room data is malformed
        } else if (classA.room.capacity < assumedClassSize) {
            fitness -= PENALTY_MEDIUM; // Penalty for exceeding room capacity
        }

        for (let j = i + 1; j < timetable.length; j++) {
            const classB = timetable[j];

            // Constraint 3: Teacher Conflict
            if (classA.teacher === classB.teacher && classA.timeSlot === classB.timeSlot) {
                fitness -= PENALTY_HEAVY;
            }

            // Constraint 4: Room Conflict
            if (classA.room && classB.room && classA.room.name === classB.room.name && classA.timeSlot === classB.timeSlot) {
                fitness -= PENALTY_HEAVY;
            }
            
            // Constraint 5: Student Group/Course Uniqueness per Timeslot
            // (Ensuring the same course isn't scheduled twice in the exact same timeslot if it's not meant to be,
            // e.g. for different student groups. Our current model is simple and assumes one group per course offering.)
            // If classA.course is the same as classB.course AND classA.timeSlot is the same as classB.timeSlot,
            // this means the same course is scheduled twice simultaneously. This is only an issue if lecturesPerCourse
            // didn't intend for this (e.g. two lectures of Math at Mon 9-10).
            // The check for "Constraint 1" (correct number of lectures) partially covers this at a macro level.
            // A more direct check might be:
            if (classA.course === classB.course && classA.timeSlot === classB.timeSlot) {
                 fitness -= PENALTY_MEDIUM; // e.g. Math scheduled twice Mon 9-10
            }
        }
    }
    
    // Future soft constraints could go here:
    // - Teacher availability preferences
    // - Spreading out courses for teachers/students
    // - Minimizing idle time

    return Math.max(0, fitness); // Fitness cannot be negative
}

    function selection(populationWithFitness, tournamentSize = 3) {
        const parents = [];
        for (let i = 0; i < populationWithFitness.length; i++) {
            let bestInTournament = null;
            for (let j = 0; j < tournamentSize; j++) {
                const randomIndex = Math.floor(Math.random() * populationWithFitness.length);
                const individual = populationWithFitness[randomIndex];
                if (bestInTournament === null || individual.fitness > bestInTournament.fitness) {
                    bestInTournament = individual;
                }
            }
            parents.push(bestInTournament.timetable);
        }
        return parents; 
    }

    function crossover(parent1, parent2) {
        if (parent1.length !== parent2.length || parent1.length === 0) {
            return [JSON.parse(JSON.stringify(parent1)), JSON.parse(JSON.stringify(parent2))];
        }
        const crossoverPoint = Math.floor(Math.random() * parent1.length);
        const offspring1Classes = parent1.slice(0, crossoverPoint).concat(parent2.slice(crossoverPoint));
        const offspring2Classes = parent2.slice(0, crossoverPoint).concat(parent1.slice(crossoverPoint));
        return [JSON.parse(JSON.stringify(offspring1Classes)), JSON.parse(JSON.stringify(offspring2Classes))];
    }

    function mutation(timetableChromosome, teachers, rooms, timeSlots, mutationRate = 0.1) {
        if (Math.random() > mutationRate) {
            return timetableChromosome;
        }
        const mutatedTimetable = JSON.parse(JSON.stringify(timetableChromosome)); 
        if (mutatedTimetable.length === 0) return mutatedTimetable;

        const classIndex = Math.floor(Math.random() * mutatedTimetable.length);
        const classToMutate = mutatedTimetable[classIndex];
        const mutationType = Math.floor(Math.random() * 3);

        switch (mutationType) {
            case 0: 
                if (teachers.length > 0) classToMutate.teacher = teachers[Math.floor(Math.random() * teachers.length)];
                break;
            case 1: 
                if (rooms.length > 0) classToMutate.room = rooms[Math.floor(Math.random() * rooms.length)];
                break;
            case 2: 
                if (timeSlots.length > 0) classToMutate.timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
                break;
        }
        return mutatedTimetable;
    }

    // --- Main Genetic Algorithm Loop ---
    function runGeneticAlgorithm(inputs) {
        const {
            courses,
            teachers,
            rooms, 
            lecturesPerCourse,
            timeSlots,
            populationSize,
            generations
        } = inputs;

        let population = initializePopulation(populationSize, courses, teachers, rooms, timeSlots, lecturesPerCourse);
        let bestTimetableOverall = null;
        let bestFitnessOverall = -1;

        for (let gen = 0; gen < generations; gen++) {
            const populationWithFitness = population.map(timetable => {
                // Ensure inputs are correctly passed from the main 'inputs' object
                const fitness = calculateFitness(timetable, inputs.rooms, inputs.courses, inputs.lecturesPerCourse); // NEW CALL
                return { timetable, fitness };
            });

            let bestInGeneration = populationWithFitness[0];
            if (!bestInGeneration) { // Population might be empty if inputs are problematic
                console.error("Population is empty. Check inputs and initialization.");
                timetableDisplay.innerHTML = '<p style="color: red;">Error: Population became empty. Cannot proceed.</p>';
                return null; 
            }
            for (let i = 1; i < populationWithFitness.length; i++) {
                if (populationWithFitness[i].fitness > bestInGeneration.fitness) {
                    bestInGeneration = populationWithFitness[i];
                }
            }

            if (bestInGeneration.fitness > bestFitnessOverall) {
                bestFitnessOverall = bestInGeneration.fitness;
                bestTimetableOverall = JSON.parse(JSON.stringify(bestInGeneration.timetable)); 
            }
            
            console.log(`Generation ${gen + 1}/${generations}: Best Fitness = ${bestInGeneration.fitness}, Overall Best Fitness = ${bestFitnessOverall}`);

            const parents = selection(populationWithFitness, 3); 
            const newPopulation = [];
            for (let i = 0; i < populationSize; i += 2) { 
                const parent1 = parents[i % parents.length]; 
                const parent2 = parents[(i + 1) % parents.length]; 

                if (!parent1 || !parent2) { 
                    console.error("Parent selection failed for new population generation.");
                    if (parent1) newPopulation.push(JSON.parse(JSON.stringify(parent1)));
                    else if (population.length > 0) newPopulation.push(JSON.parse(JSON.stringify(population[0]))); // Fallback
                    if (parent2 && newPopulation.length < populationSize) newPopulation.push(JSON.parse(JSON.stringify(parent2)));
                    else if (population.length > 1 && newPopulation.length < populationSize) newPopulation.push(JSON.parse(JSON.stringify(population[1]))); // Fallback
                    while(newPopulation.length < 2 && newPopulation.length < populationSize && population.length > 0){ // Ensure there's something to crossover if possible
                        newPopulation.push(JSON.parse(JSON.stringify(population[Math.floor(Math.random()*population.length)])));
                    }
                    if(newPopulation.length < 2 && i+2 >= populationSize) { // if not enough for a pair and it's the end, just add them
                         population = newPopulation; continue;
                    } else if (newPopulation.length < 2) { // not enough for a pair, try to fill more to make a pair for next iteration or break if not possible
                        console.warn("Could not form a pair for crossover, filling with random or breaking");
                        while(newPopulation.length < populationSize && newPopulation.length < 2 && population.length > 0){
                             newPopulation.push(JSON.parse(JSON.stringify(population[Math.floor(Math.random()*population.length)])));
                        }
                        if(newPopulation.length < 2) {population = newPopulation; continue;} // still not enough
                    }
                }
                 // Re-check after potential fill for safety
                const currentParent1 = newPopulation.length > i ? newPopulation[i] : parent1;
                const currentParent2 = newPopulation.length > i+1 ? newPopulation[i+1] : parent2;
                
                if(!currentParent1 || !currentParent2){ // If still bad, skip this pair
                    console.error("Skipping crossover/mutation for a pair due to missing parents even after fallback.");
                    if(currentParent1 && newPopulation.length < populationSize) newPopulation.push(currentParent1);
                    if(currentParent2 && newPopulation.length < populationSize) newPopulation.push(currentParent2);
                    continue;
                }


                let [offspring1, offspring2] = crossover(currentParent1, currentParent2);
                
                offspring1 = mutation(offspring1, teachers, rooms, timeSlots, 0.1);
                offspring2 = mutation(offspring2, teachers, rooms, timeSlots, 0.1);

                newPopulation.push(offspring1);
                if (newPopulation.length < populationSize) { 
                    newPopulation.push(offspring2);
                }
            }
            if (newPopulation.length === 0 && populationSize > 0) {
                console.warn("New population is empty. This might indicate issues with selection or crossover/mutation retaining individuals. Retaining old population for this generation.");
                // Optionally, re-populate or re-initialize to prevent GA from stalling
                // population = initializePopulation(populationSize, courses, teachers, rooms, timeSlots, lecturesPerCourse);
            } else {
                 population = newPopulation;
            }

            if (population.length === 0 && populationSize > 0) {
                console.error("Population became empty mid-generation. Stopping GA.");
                timetableDisplay.innerHTML = '<p style="color: red;">Error: Population became empty during evolution. Cannot proceed.</p>';
                return bestTimetableOverall; // Return whatever best we had so far
            }
        }

        console.log("Genetic Algorithm finished.");
        console.log("Best timetable found:", bestTimetableOverall);
        console.log("With fitness:", bestFitnessOverall);
        
        return bestTimetableOverall;
    }
});
