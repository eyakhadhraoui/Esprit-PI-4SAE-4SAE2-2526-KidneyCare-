package com.example.NEPHRO.Repository;

import com.example.NEPHRO.Entities.NotificationMedecin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationMedecinRepository extends JpaRepository<NotificationMedecin, Long> {

    /** Avant suppression de lignes {@code resultat_labtest} référencées (colonne homonyme historique). */
    void deleteAllByIdResultatLaboratoireIn(Collection<Long> idsResultatLabtest);

    /** Pour le dashboard : toutes les notifications du médecin, les plus récentes en premier. */
    List<NotificationMedecin> findByIdMedecinOrderByDateCreationDesc(Long idMedecin);

    /** Non lues uniquement (badge / compteur). */
    List<NotificationMedecin> findByIdMedecinAndLuFalseOrderByDateCreationDesc(Long idMedecin);

    long countByIdMedecinAndLuFalse(Long idMedecin);
}
