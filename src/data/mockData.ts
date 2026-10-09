import { GarmentItem, LookbookCard, CulturalArticle } from '../types';

export const HERO_ASSETS = {
  heroBanner: '/src/assets/images/mach_viet_hero_1791549541458.jpg',
  aoNguThan: '/src/assets/images/ao_ngu_than_exhibit_1791549551532.jpg',
  aoNhatBinh: '/src/assets/images/ao_nhat_binh_exhibit_1791549562498.jpg',
};

export const GARMENTS_DATA: GarmentItem[] = [
  {
    id: 'ngu-than-tay-chen',
    name: 'Áo Ngũ Thân Tay Chẽn',
    subName: 'Việt phục thường nhật & thanh lịch',
    category: 'ngu_than_chen',
    originEra: 'Thời chúa Nguyễn Phúc Khoát (1744) & định hình thời vua Minh Mạng (1827–1837)',
    image: HERO_ASSETS.aoNguThan,
    silhouette: 'Phom đứng thẳng, tay áo may ôm gọn từ khuỷu tay đến cổ tay, 5 thân áo cài cúc bên hữu (bên phải).',
    idealOccasions: ['Chụp kỷ yếu', 'Dạo phố cuối tuần', 'Thuyết trình văn hóa', 'Lễ hội trường học'],
    youthStylingTip: 'Rất hợp mặc cùng quần lụa trắng hoặc đen, có thể phối giày da oxford hoặc sneaker trắng tối giản để giữ nét thanh lịch hiện đại.',
    structure: [
      {
        name: 'Năm thân áo (Ngũ thân)',
        description: '2 thân trước, 2 thân sau ghép sống lưng, và 1 thân con (tiểu bồi) nằm kín đáo phía trong.',
        significance: 'Tượng trưng cho tứ thân phụ mẫu (cha mẹ hai bên) ôm ấp, chở che người mặc (thân con).'
      },
      {
        name: 'Năm cúc ngọc/đồng/gỗ',
        description: 'Hệ 5 cúc cài lệch từ cổ sang nách và dọc sườn phải.',
        significance: 'Biểu trưng cho Ngũ Thường: Nhân, Lễ, Nghĩa, Trí, Tín.'
      },
      {
        name: 'Cổ lập lĩnh (Cổ đứng)',
        description: 'Cổ đứng vuông góc hoặc bo tròn nhẹ, cao khoảng 3–4cm, ôm vừa vặn quanh cổ, kín đáo và tôn phong thái.'
      },
      {
        name: 'Tay chẽn gọn gàng',
        description: 'Ống tay thu nhỏ dần về phía cổ tay, thuận tiện cho việc học tập, di chuyển năng động.'
      }
    ],
    colorPalette: [
      { name: 'Xanh lục bảo', hex: '#1B4D3E' },
      { name: 'Đỏ chu sa', hex: '#8B2626' },
      { name: 'Vàng hoa cúc', hex: '#D4A054' },
      { name: 'Chàm than', hex: '#2A3439' }
    ],
    isFeatured: true
  },
  {
    id: 'ao-tac-ngu-than-tay-thung',
    name: 'Áo Tấc (Ngũ Thân Tay Thụng)',
    subName: 'Lễ phục trang trọng cổ truyền',
    category: 'ngu_than_tac',
    originEra: 'Triều Nguyễn (Thế kỷ 19 - đầu thế kỷ 20)',
    silhouette: 'Tương tự ngũ thân nhưng tay áo may thụng dài, rộng từ 30 đến 50cm, viền tay buông chùng trang nhã.',
    idealOccasions: ['Lễ tốt nghiệp đại học', 'Lễ Tết truyền thống', 'Đám cưới', 'Nghi thức dâng hương'],
    youthStylingTip: 'Kết hợp cùng khăn đóng (khăn vấn) chữ Nhân hoặc chữ Nhất, tư thế chắp tay lễ phép tôn vinh vẻ trang trọng cổ điển.',
    structure: [
      {
        name: 'Ống tay thụng rộng (Tay tấc)',
        description: 'Tay áo buông dài bằng hoặc qua gấu áo, khi khoanh tay tạo phom chữ nhật uy nghiêm.',
        significance: 'Thể hiện phong thái điềm đạm, khiêm nhường và quy củ của người mặc trong các nghi lễ trang nghiêm.'
      },
      {
        name: 'Thân áo năm tà dài qua gối',
        description: 'Phom áo suông rộng vừa phải, vạt cong hình cánh cung uyển chuyển khi bước đi.'
      },
      {
        name: 'Khăn vấn đội đầu',
        description: 'Nam đội khăn đóng cuộn nếp, nữ đội khăn vấn nhung hoặc vấn tết tóc.'
      }
    ],
    colorPalette: [
      { name: 'Đỏ huyết dụ', hex: '#7A1F26' },
      { name: 'Vàng hoàng yến', hex: '#CFA043' },
      { name: 'Xanh thiên thanh', hex: '#4A6B82' },
      { name: 'Trắng bạch ngọc', hex: '#EAE6DF' }
    ],
    isFeatured: true
  },
  {
    id: 'ao-nhat-binh',
    name: 'Áo Nhật Bình',
    subName: 'Thường phục hoàng tộc & mệnh phụ triều Nguyễn',
    category: 'nhat_binh',
    originEra: 'Quy chế y phục triều Nguyễn (từ thời Gia Long đến Bảo Đại)',
    image: HERO_ASSETS.aoNhatBinh,
    silhouette: 'Cổ áo hình chữ nhật to bản xẻ dọc trước ngực, hai vạt áo buộc dải lụa hoặc cài khuy kim loại, ống tay có dải ngũ sắc.',
    idealOccasions: ['Chụp ảnh nghệ thuật', 'Lễ cưới truyền thống', 'Sự kiện văn hóa sinh viên'],
    youthStylingTip: 'Rất ấn tượng khi mặc khoác ngoài áo lót màu kem hoặc tương phản nhẹ, mang quạt xếp lụa hoặc trâm cài tóc hoa sen.',
    structure: [
      {
        name: 'Cổ áo Nhật Bình',
        description: 'Bản nẹp cổ hình chữ nhật chạy dọc từ cổ xuống ngực, thêu hoa văn loan phụng, hoa lá đối xứng.'
      },
      {
        name: 'Dải ngũ hành tay áo',
        description: 'Đầu tay áo có dải viền 5 màu: lục, vàng, xanh lam, trắng, đỏ đại diện ngũ hành.'
      },
      {
        name: 'Hai dải thắt thắt lưng / giải bội',
        description: 'Dải lụa thêu thả dài phía trước tôn thêm nét thướt tha khi chuyển động.'
      }
    ],
    colorPalette: [
      { name: 'Đỏ xích', hex: '#9E2A2B' },
      { name: 'Tím hoa cà', hex: '#5E3A5A' },
      { name: 'Cam đất', hex: '#B85D36' },
      { name: 'Vàng hoàng cúc', hex: '#E0AA3E' }
    ],
    isFeatured: true
  },
  {
    id: 'ao-giao-linh',
    name: 'Áo Giao Lĩnh (Tràng Vạt)',
    subName: 'Cổ phục kinh điển thời Lê sơ - Lê Trung Hưng',
    category: 'giao_linh',
    originEra: 'Thịnh hành từ thời Lý, Trần, đặc biệt hoàn thiện ở thời Hậu Lê (Thế kỷ 15–18)',
    silhouette: 'Cổ áo vắt chéo chữ Y, vạt bên trái đè lên vạt bên phải, tay áo rộng bay bổng, buộc dây bên mạn sườn.',
    idealOccasions: ['Văn nghệ trường học', 'Dạo hội chợ sách', 'Chụp ảnh ngoại cảnh'],
    youthStylingTip: 'Có thể kết hợp với chân váy xòe xếp ly hoặc quần thụng trơn màu, tạo nên nét đẹp thư sinh thanh tao.',
    structure: [
      {
        name: 'Cổ giao lĩnh',
        description: 'Hai vạt cổ vắt chéo trước ngực, viền cổ may tỉ mỉ, để lộ cổ áo con bên trong tương phản.'
      },
      {
        name: 'Dải đai thắt lưng',
        description: 'Thắt đai lụa giữ nếp áo ở eo, tạo điểm nhấn thanh thoát.'
      }
    ],
    colorPalette: [
      { name: 'Xanh chàm cổ', hex: '#2C3E50' },
      { name: 'Trắng ngà', hex: '#F0EBE1' },
      { name: 'Nâu trầm đồng', hex: '#634832' }
    ]
  },
  {
    id: 'ao-tu-than',
    name: 'Áo Tứ Thân',
    subName: 'Hồn sắc đồng bằng Bắc Bộ',
    category: 'tu_than',
    originEra: 'Cổ trang dân gian thế kỷ 18–19',
    silhouette: 'Áo gồm 4 vạt dài, hai vạt sau may liền lưng, hai vạt trước buông tự do hoặc buộc vạt chéo ở eo.',
    idealOccasions: ['Hội làng', 'Biểu diễn âm nhạc dân tộc', 'Ngày hội giao lưu văn hóa'],
    youthStylingTip: 'Phối cùng yếm hoa mai/yếm đào, thắt lưng lụa xanh màu lá chuối hoặc hồng cánh sen, nón quai thao thanh lịch.',
    structure: [
      {
        name: 'Bốn vạt áo',
        description: 'Hai vạt sau khâu liền thành đường sống lưng, hai vạt trước để buông rủ hoặc thắt nút.'
      },
      {
        name: 'Áo yếm lót trong',
        description: 'Chiếc yếm che ngực màu đào, nâu hoặc trắng với quai buộc duyên dáng.'
      }
    ],
    colorPalette: [
      { name: 'Nâu sồng gụ', hex: '#4A3525' },
      { name: 'Hồng cánh sen', hex: '#C25975' },
      { name: 'Vàng mơ', hex: '#E6B86A' }
    ]
  }
];

export const LOOKBOOK_SAMPLES: LookbookCard[] = [
  {
    id: 'lb-1',
    title: 'Kỷ Yếu Sân Trường Cổ Kính',
    concept: 'Nét thư sinh thanh lịch giữa hàng cây và giảng đường',
    occasion: 'Chụp kỷ yếu tốt nghiệp',
    primaryGarment: 'Áo Ngũ Thân Tay Chẽn (Xanh lục & Trắng ngà)',
    palette: ['#1B4D3E', '#FAF7F2', '#241E1C'],
    stylingItems: ['Áo ngũ thân chẽn', 'Quần lụa trắng', 'Giày Oxford da nâu', 'Khăn đóng xếp nếp'],
    author: 'CLB Cổ phục Đại học KHXH&NV',
    audience: 'Học sinh - Sinh viên'
  },
  {
    id: 'lb-2',
    title: 'Dạo Phố Tết Phố Cổ',
    concept: 'Ấm áp, rạng rỡ và tràn đầy sức sống mùa xuân',
    occasion: 'Dạo Tết Nguyên Đán',
    primaryGarment: 'Áo Tấc Ngũ Thân (Đỏ Huyết Dụ)',
    palette: ['#7A1F26', '#D4A054', '#FAF7F2'],
    stylingItems: ['Áo tấc đỏ', 'Quần lụa kem', 'Quạt nan lụa thêu sen', 'Túi gấm đeo chéo'],
    author: 'Nhóm Bạn Trẻ Mạch Việt',
    audience: 'Giới trẻ yêu phong cách retro'
  },
  {
    id: 'lb-3',
    title: 'Hội Ngộ Thư Quán',
    concept: 'Phong cách tối giản, hoài niệm mà gần gũi',
    occasion: 'Giao lưu văn học & Cà phê',
    primaryGarment: 'Áo Giao Lĩnh (Xanh Chàm & Trắng Ngà)',
    palette: ['#2C3E50', '#EAE6DF', '#634832'],
    stylingItems: ['Áo giao lĩnh', 'Quần ống suông linen', 'Túi tote vải mộc', 'Kính gọng tròn'],
    author: 'Ban Biên Tập Mạch Việt',
    audience: 'Sinh viên'
  }
];

export const CULTURAL_ARTICLES: CulturalArticle[] = [
  {
    id: 'bai-1-ngu-than',
    title: 'Triết lý Áo Ngũ Thân: Khi chiếc áo là bài học làm người',
    subtitle: 'Vì sao áo có đúng 5 thân và 5 cúc cài?',
    summary: 'Áo ngũ thân không chỉ là trang phục giữ ấm hay che thân, mà là hiện thân của đạo hiếu và nhân cách sống của người Việt xưa.',
    keyTakeaway: '4 thân áo ngoài tượng trưng cho tứ thân phụ mẫu (cha mẹ ruột và cha mẹ vợ/chồng), thân con bên trong tượng trưng cho người mặc luôn được gia đình chở che. 5 cúc áo nhắc nhở về 5 đức tính Ngũ Thường: Nhân, Lễ, Nghĩa, Trí, Tín.',
    culturalDimension: 'Cấu trúc y phục & Đạo đức gia đình',
    etiquetteTip: 'Khi mặc áo ngũ thân, luôn cài đủ cả 5 cúc, chỉnh cổ áo ngay ngắn để toát lên phong thái chỉn chu, điềm đạm.'
  },
  {
    id: 'bai-2-quy-cach-huu-nham',
    title: 'Cổ lập lĩnh và quy cách khuy cài bên hữu',
    subtitle: 'Nét đặc trưng nhận diện trang phục Việt truyền thống',
    summary: 'Trang phục Việt Nam thời Nguyễn quy định cài khuy sang nách phải (Hữu nhậm), cổ đứng thẳng ôm trọn cổ (Lập lĩnh).',
    keyTakeaway: 'Hữu nhậm là quy cách văn minh lâu đời. Cổ lập lĩnh của áo dài ngũ thân là tiền thân trực tiếp của chiếc áo dài truyền thống mà chúng ta thấy ngày nay.',
    culturalDimension: 'Lịch sử phát triển trang phục',
    etiquetteTip: 'Cổ áo nên vừa vặn, không quá chật gây khó thở, nhưng cũng không hở quá rộng làm mất dáng áo cổ đứng.'
  },
  {
    id: 'bai-3-phoi-do-tre',
    title: 'Người trẻ phối Việt phục: Ranh giới giữa sáng tạo và tôn trọng',
    subtitle: 'Có nên mang sneaker hay đeo kính mát khi mặc cổ phục?',
    summary: 'Sự tiếp nối của người trẻ là cách di sản sống lại. Phối thêm phụ kiện hiện đại hoàn toàn khả thi nếu giữ vững phom cốt y phục.',
    keyTakeaway: 'Nguyên tắc vàng: Giữ nguyên cốt cách trang phục (phom cắt, đường may, cách cài khuy), có thể tự do biến tấu phụ kiện hiện đại (giày sneaker tối giản, đồng hồ cổ điển, túi canvas in họa tiết truyền thống). Tránh biến tướng phom dáng làm biến dạng ý nghĩa văn hóa.',
    culturalDimension: 'Văn hóa đương đại & Giới trẻ',
    etiquetteTip: 'Ưu tiên sneaker màu trơn (trắng/đen/kem), tránh giày thể thao hầm hố dạ quang quá chói làm lấn át vẻ trang nhã của tà áo.'
  }
];
