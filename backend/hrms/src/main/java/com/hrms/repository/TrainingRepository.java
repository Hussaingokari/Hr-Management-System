package com.hrms.repository;

import com.hrms.entity.Training;
import com.hrms.entity.Training.TrainingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingRepository extends JpaRepository<Training, Long> {

    Page<Training> findByStatus(
            TrainingStatus status,
            Pageable pageable);

    Page<Training> findByCategory(
            String category,
            Pageable pageable);
}