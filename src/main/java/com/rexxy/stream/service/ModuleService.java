package com.rexxy.stream.service;

import com.rexxy.stream.dto.ModuleDTO;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.Course;
import com.rexxy.stream.model.Module;
import com.rexxy.stream.repository.CourseRepository;
import com.rexxy.stream.repository.ModuleRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ModuleService {
    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;

    public ModuleService(ModuleRepository moduleRepository, CourseRepository courseRepository) {
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
    }

    public List<ModuleDTO> getAllModules() {
        return moduleRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Module::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ModuleDTO getModuleById(String id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", id));
        return convertToDTO(module);
    }

    public List<ModuleDTO> getModulesByCourseId(String courseId) {
        // Verify course exists
        courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        return moduleRepository.findByCourse_Id(courseId)
                .stream()
                .sorted(Comparator.comparing(Module::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ModuleDTO createModule(ModuleDTO moduleDTO) {
        Course course = courseRepository.findById(moduleDTO.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", moduleDTO.getCourseId()));

        Module module = new Module();
        module.setCourse(course);
        module.setTitle(moduleDTO.getTitle());
        module.setDuration(moduleDTO.getDuration());
        module.setOrderIndex(moduleDTO.getOrderIndex());

        Module savedModule = moduleRepository.save(module);
        return convertToDTO(savedModule);
    }

    public ModuleDTO updateModule(String id, ModuleDTO moduleDTO) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", id));

        if (moduleDTO.getCourseId() != module.getCourse().getId()) {
            Course course = courseRepository.findById(moduleDTO.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", moduleDTO.getCourseId()));
            module.setCourse(course);
        }

        module.setTitle(moduleDTO.getTitle());
        module.setDuration(moduleDTO.getDuration());
        module.setOrderIndex(moduleDTO.getOrderIndex());

        Module updatedModule = moduleRepository.save(module);
        return convertToDTO(updatedModule);
    }

    public void deleteModule(String id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", id));
        moduleRepository.delete(module);
    }

    private ModuleDTO convertToDTO(Module module) {
        return new ModuleDTO(
                module.getId(),
                module.getCourse().getId(),
                module.getTitle(),
                module.getDuration(),
                module.getOrderIndex());
    }
}
