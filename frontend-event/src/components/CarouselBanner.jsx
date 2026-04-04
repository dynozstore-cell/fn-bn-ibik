import React from 'react';
import { Button } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const CarouselBanner = () => {
  const banners = [
    {
      id: 1,
      title: 'Temukan Event Terbaik',
      subtitle: 'Jelajahi berbagai event menarik di sekitar Anda dan buat pengalaman tak terlupakan',
      image: 'https://images.unsplash.com/photo-1540515669616-5d97627452e5?w=1920&q=80',
    },
    {
      id: 2,
      title: 'Workshop & Seminar',
      subtitle: 'Tingkatkan skill dan pengetahuan Anda dengan event profesional berkualitas',
      image: 'https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=1920&q=80',
    },
    {
      id: 3,
      title: 'Konser & Festival',
      subtitle: 'Nikmati hiburan terbaik dari berbagai genre musik dan seni pertunjukan',
      image: 'https://images.unsplash.com/photo-1459749381174-1c12b6c8a877?w=1920&q=80',
    },
  ];

  return (
    <section className="carousel-banner" id="home">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div style={{ position: 'relative', height: '600px' }}>
              <img 
                src={banner.image} 
                alt={banner.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="carousel-overlay">
                <div className="carousel-content">
                  <h1>{banner.title}</h1>
                  <p>{banner.subtitle}</p>
                  <div className="d-flex gap-3 justify-content-center flex-wrap">
                    <Button className="btn-purple btn-lg">
                      Jelajahi Event
                    </Button>
                    <Button variant="outline-light" className="btn-lg">
                      Pelajari Lebih
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default CarouselBanner;
