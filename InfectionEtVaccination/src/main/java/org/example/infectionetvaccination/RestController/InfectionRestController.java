package org.example.infectionetvaccination.RestController;

import org.example.infectionetvaccination.DTO.Exercise;
import org.example.infectionetvaccination.Entity.Infection;
import org.example.infectionetvaccination.Service.InfectionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/infections")
@CrossOrigin(origins = "http://localhost:4200")
public class InfectionRestController {

    private final InfectionService infectionService;



    @GetMapping("/exercises")
    public List<Exercise> getAllExercises() {
        return infectionService.getExercises();
    }

    @GetMapping("/exercises/{id}")
    public Exercise getExerciseById(@PathVariable("id") int id) {
        return infectionService.getExerciseById(id);
    }


    public InfectionRestController(InfectionService infectionService) {
        this.infectionService = infectionService;
    }

    @PostMapping
    public Infection create(@RequestBody Infection infection) {
        return infectionService.save(infection);
    }

    @GetMapping
    public List<Infection> getAll() {
        return infectionService.findAll();
    }

    @GetMapping("/{id}")
    public Infection getById(@PathVariable Long id) {
        return infectionService.findById(id).orElseThrow();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        infectionService.delete(id);
    }

    @PutMapping("/{id}")
    public Infection update(@PathVariable long id, @RequestBody Infection infection) {
        infection.setId(id);
        return infectionService.save(infection);
    }

}
