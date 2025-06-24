import React from 'react';
import './ProjectSelector.css';

const ProjectSelector = ({ projects, selectedProject, onProjectSelect }) => {
  return (
    <div className="project-selector-container">
      <select 
        className="project-selector"
        onChange={(e) => onProjectSelect(e.target.value)}
        value={selectedProject || ''}
      >
        <option value="">Select a Project</option>
        {projects.map((project) => (
          <option key={project.projectId} value={project.projectId}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProjectSelector; 