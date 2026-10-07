import { useMemo, useRef, useState } from 'react';
import ApiState from '../../components/ApiState/ApiState';
import { useApiData } from '../../services/api/useApiData';
import { presentProject } from '../../services/api/presentRecords';
import FilterChips from '../../components/EventUI/FilterChips';
import SectionHeading from '../../components/EventUI/SectionHeading';
import {
  filterProjects,
} from '../../data/projects';
import ProjectCard from './components/ProjectCard';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import teamIcon from './assets/team.svg';
import ProjectsCircuit from './ProjectsCircuit';
import './Projects.css';

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data, loading, error, reload } = useApiData('projects');
  const projects = useMemo(() => (data || []).map(presentProject), [data]);
  const projectCategories = useMemo(() => {
    const language = document.documentElement.lang === 'en' ? 1 : 0;
    const labels = { defense: ['مشاريع دفاعية','Defense projects'], invention: ['مشاريع ابتكارية','Invention projects'] };
    return [{ id: 'all', label: language ? 'All projects' : 'عرض الكل' }, ...[...new Set(projects.map((project) => project.categoryId))].map((id) => ({ id, label: labels[id]?.[language] || id }))];
  }, [projects]);

  const visibleProjects = useMemo(
    () => filterProjects(projects, selectedCategory, searchQuery),
    [projects, searchQuery, selectedCategory],
  );
  const hasSearchQuery = searchQuery.trim().length > 0;
  const rootRef = useRef(null);
  const signature = loading ? 'loading' : `${selectedCategory}|${visibleProjects.map((p) => p.id).join(',')}`;

  return (
    <div ref={rootRef} className="projects-page" dir="rtl">
      <ProjectsCircuit rootRef={rootRef} signature={signature} />
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

          <ApiState loading={loading} error={error} empty={!loading && !error && !projects.length ? 'لا توجد مشاريع منشورة حاليًا.' : ''} onRetry={reload} />
          {!loading && !error && visibleProjects.length ? (
            <div className="projects-grid">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} teamIcon={teamIcon} />
              ))}
            </div>
          ) : !loading && !error && projects.length > 0 && (
            <div className="projects-empty" role="status">
              <h3>{hasSearchQuery ? 'لا توجد نتائج مطابقة.' : 'لا توجد مشاريع مطابقة للتصفية.'}</h3>
              <p>جرّب تعديل عبارة البحث أو اختيار تصنيف آخر.</p>
            </div>
          )}
        </div>
      </section>
      <div className="rt-end" aria-hidden="true" />
    </div>
  );
}
