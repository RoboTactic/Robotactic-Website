import { useMemo, useState } from 'react';
import FilterChips from '../../components/EventUI/FilterChips';
import SectionHeading from '../../components/EventUI/SectionHeading';
import {
  filterProjects,
  projectCategories,
  projects,
  projectsEmptyState,
  projectsSearchEmptyState,
} from '../../data/projects';
import ProjectCard from './components/ProjectCard';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import teamIcon from './assets/team.svg';
import './Projects.css';

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleProjects = useMemo(
    () => filterProjects(projects, selectedCategory, searchQuery),
    [searchQuery, selectedCategory],
  );
  const hasSearchQuery = searchQuery.trim().length > 0;
  const emptyState = hasSearchQuery ? projectsSearchEmptyState : projectsEmptyState;

  return (
    <div className="projects-page" dir="rtl">
      <header className="projects-hero">
        <img className="projects-hero__pattern" src={circuitPattern} alt="" />
        <div className="projects-page__container projects-hero__content">
          <div className="projects-overline"><span>SHOWROOM</span><i /></div>
          <h1>معرض المشاريع</h1>
          <p>اكتشف المشاريع التقنية والابتكارية المشاركة في روبوتاكتك، وتعرّف على أفكار الفرق وأعضائها بعد اعتماد مشاركتهم.</p>
        </div>
      </header>

      <section className="projects-browser" aria-labelledby="projects-browser-title">
        <div className="projects-page__container">
          <SectionHeading id="projects-browser-title">تصفّح المشاريع</SectionHeading>
          <div className="projects-controls">
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ابحث عن مشروع" aria-label="ابحث عن مشروع" />
            <FilterChips items={projectCategories} selectedId={selectedCategory}
              onSelect={setSelectedCategory} ariaLabel="تصفية المشاريع حسب التصنيف"
              className="projects-filters" />
          </div>

          {visibleProjects.length ? (
            <div className="projects-grid">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} teamIcon={teamIcon} />
              ))}
            </div>
          ) : (
            <div className="projects-empty" role="status">
              <h3>{emptyState.title}</h3>
              <p>{emptyState.description}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
