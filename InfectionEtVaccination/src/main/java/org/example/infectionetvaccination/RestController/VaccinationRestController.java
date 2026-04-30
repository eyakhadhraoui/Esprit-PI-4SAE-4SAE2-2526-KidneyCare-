package org.example.infectionetvaccination.RestController;

import org.example.infectionetvaccination.Entity.Vaccination;
import org.example.infectionetvaccination.Service.VaccinationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vaccinations")
@CrossOrigin(origins = "http://localhost:4200")
public class VaccinationRestController {

    private final VaccinationService vaccinationService;



    public VaccinationRestController(VaccinationService vaccinationService) {
        this.vaccinationService = vaccinationService;
    }

    @PostMapping
    public Vaccination create(@RequestBody Vaccination vaccination) {
        return vaccinationService.save(vaccination);
    }

    @GetMapping
    public List<Vaccination> getAll() {
        return vaccinationService.findAll();
    }

    @GetMapping("/{id}")
    public Vaccination getById(@PathVariable Long id) {
        return vaccinationService.findById(id).orElseThrow();
    }

    @GetMapping("/infection/{infectionId}")
    public List<Vaccination> getByInfection(@PathVariable Long infectionId) {
        return vaccinationService.findByInfectionId(infectionId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        vaccinationService.delete(id);
    }

    @PutMapping("/{id}")
    public Vaccination update(@PathVariable long id, @RequestBody Vaccination vaccination) {
        vaccination.setId(id);
        return vaccinationService.save(vaccination);
    }


}
