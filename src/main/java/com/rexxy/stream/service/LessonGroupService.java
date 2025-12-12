package com.rexxy.stream.service;

import com.rexxy.stream.dto.LessonGroupDTO;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.Module;
import com.rexxy.stream.repository.LessonGroupRepository;
import com.rexxy.stream.repository.ModuleRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LessonGroupService {
        private final LessonGroupRepository lessonGroupRepository;
        private final ModuleRepository moduleRepository;

        public LessonGroupService(LessonGroupRepository lessonGroupRepository, ModuleRepository moduleRepository) {
                this.lessonGroupRepository = lessonGroupRepository;
                this.moduleRepository = moduleRepository;
        }

        public List<LessonGroupDTO> getAllLessonGroups() {
                return lessonGroupRepository.findAll()
                                .stream()
                                .sorted(Comparator.comparing(LessonGroup::getOrderIndex,
                                                Comparator.nullsLast(Comparator.naturalOrder())))
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        public LessonGroupDTO getLessonGroupById(String id) {
                LessonGroup lessonGroup = lessonGroupRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("LessonGroup", "id", id));
                return convertToDTO(lessonGroup);
        }

        public List<LessonGroupDTO> getLessonGroupsByModuleId(String moduleId) {
                // Verify module exists
                moduleRepository.findById(moduleId)
                                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", moduleId));

                return lessonGroupRepository.findByModule_Id(moduleId)
                                .stream()
                                .sorted(Comparator.comparing(LessonGroup::getOrderIndex,
                                                Comparator.nullsLast(Comparator.naturalOrder())))
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        @CacheEvict(value = "courseHierarchy", allEntries = true)
        public LessonGroupDTO createLessonGroup(LessonGroupDTO lessonGroupDTO) {
                Module module = moduleRepository.findById(lessonGroupDTO.getModuleId())
                                .orElseThrow(() -> new ResourceNotFoundException("Module", "id",
                                                lessonGroupDTO.getModuleId()));

                LessonGroup lessonGroup = new LessonGroup();
                lessonGroup.setModule(module);
                lessonGroup.setTitle(lessonGroupDTO.getTitle());
                lessonGroup.setOrderIndex(lessonGroupDTO.getOrderIndex());

                LessonGroup savedLessonGroup = lessonGroupRepository.save(lessonGroup);
                return convertToDTO(savedLessonGroup);
        }

        @CacheEvict(value = "courseHierarchy", allEntries = true)
        public LessonGroupDTO updateLessonGroup(String id, LessonGroupDTO lessonGroupDTO) {
                LessonGroup lessonGroup = lessonGroupRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("LessonGroup", "id", id));

                if (lessonGroupDTO.getModuleId() != lessonGroup.getModule().getId()) {
                        Module module = moduleRepository.findById(lessonGroupDTO.getModuleId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Module", "id",
                                                        lessonGroupDTO.getModuleId()));
                        lessonGroup.setModule(module);
                }

                lessonGroup.setTitle(lessonGroupDTO.getTitle());
                lessonGroup.setOrderIndex(lessonGroupDTO.getOrderIndex());

                LessonGroup updatedLessonGroup = lessonGroupRepository.save(lessonGroup);
                return convertToDTO(updatedLessonGroup);
        }

        @CacheEvict(value = "courseHierarchy", allEntries = true)
        public void deleteLessonGroup(String id) {
                LessonGroup lessonGroup = lessonGroupRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("LessonGroup", "id", id));
                lessonGroupRepository.delete(lessonGroup);
        }

        private LessonGroupDTO convertToDTO(LessonGroup lessonGroup) {
                return new LessonGroupDTO(
                                lessonGroup.getId(),
                                lessonGroup.getModule().getId(),
                                lessonGroup.getTitle(),
                                lessonGroup.getOrderIndex());
        }
}
