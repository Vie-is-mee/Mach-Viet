import { PreferenceProfile } from '../types';
import { GARMENTS_DATA, STUDIO_COLOR_PRESETS } from '../data/mockData';

export interface StudioAppliedResult {
  garmentId?: string;
  garmentName?: string;
  colorHex?: string;
  colorName?: string;
  innerLayer?: 'ao-lot-trang' | 'yem-dao';
  bottomLayer?: 'quan-lua-trang' | 'quan-den' | 'vay-xep-ly';
  accessoryHead?: 'khan-dong' | 'khan-van' | 'none';
  accessoryHand?: 'quat-nan' | 'tui-gam' | 'none';
  occasionGoal?: string;
  successMessages: string[];
  noticeMessages: string[];
}

/**
 * Ánh xạ an toàn từ Hồ sơ sở thích sang cấu hình Studio
 * Xử lý chặt chẽ:
 * - Tránh trùng màu bị né
 * - Giữ lựa chọn an toàn nếu chọn 'undecided'
 * - Ưu tiên Áo tứ thân với yếm đào / váy phù hợp
 * - Báo cáo rõ ràng những gì áp dụng được và chưa hỗ trợ
 */
export function mapPreferenceToStudio(
  profile: PreferenceProfile,
  currentGarmentId: string,
  currentColorHex: string
): StudioAppliedResult {
  const result: StudioAppliedResult = {
    successMessages: [],
    noticeMessages: [],
  };

  // 1. Ánh xạ loại áo
  if (profile.garmentChoice === 'undecided') {
    result.noticeMessages.push(
      'Hồ sơ của bạn chọn "Chưa biết chọn loại nào": Giữ nguyên y phục hiện tại trên bàn phối.'
    );
  } else if (profile.garmentChoice === 'ao_dai') {
    result.garmentId = 'ao-dai-hien-dai';
    result.garmentName = 'Áo Dài Hiện Đại (Tân Thời)';
    result.innerLayer = 'ao-lot-trang';
    result.bottomLayer = 'quan-lua-trang';
    result.successMessages.push('Đã áp dụng: Áo Dài Hiện Đại & Quần lụa trắng');
  } else if (profile.garmentChoice === 'ao_tu_than') {
    result.garmentId = 'ao-tu-than';
    result.garmentName = 'Áo Tứ Thân';
    result.innerLayer = 'yem-dao'; // Chuẩn văn hóa Bắc Bộ: Tứ thân phối yếm đào
    result.bottomLayer = 'quan-den'; // Mặc cùng quần đen hoặc váy xúp
    result.successMessages.push('Đã áp dụng: Áo Tứ Thân phối Yếm lụa đào');
  } else if (profile.garmentChoice === 'ao_ngu_than') {
    if (profile.subGarmentVariantId === 'ao-tac-ngu-than-tay-thung') {
      result.garmentId = 'ao-tac-ngu-than-tay-thung';
      result.garmentName = 'Áo Tấc (Ngũ Thân Tay Thụng)';
      result.innerLayer = 'ao-lot-trang';
      result.bottomLayer = 'quan-lua-trang';
      result.successMessages.push('Đã áp dụng: Áo Tấc tay thụng (Lễ phục)');
    } else {
      result.garmentId = 'ngu-than-tay-chen';
      result.garmentName = 'Áo Ngũ Thân Tay Chẽn';
      result.innerLayer = 'ao-lot-trang';
      result.bottomLayer = 'quan-lua-trang';
      result.successMessages.push('Đã áp dụng: Áo Ngũ Thân Tay Chẽn');
    }
  } else if (profile.garmentChoice === 'ao_nhat_binh') {
    result.garmentId = 'ao-nhat-binh';
    result.garmentName = 'Áo Nhật Bình';
    result.innerLayer = 'ao-lot-trang';
    result.bottomLayer = 'quan-lua-trang';
    result.successMessages.push('Đã áp dụng: Áo Nhật Bình hoàng cung');
  }

  // 2. Ánh xạ màu sắc (Tuyệt đối không lấy màu trong avoidedColors)
  const validLikedColor = profile.likedColors.find((hex) => {
    const isAvoided = profile.avoidedColors.includes(hex);
    const existsInStudio = STUDIO_COLOR_PRESETS.some((c) => c.hex.toLowerCase() === hex.toLowerCase());
    return !isAvoided && existsInStudio;
  });

  if (validLikedColor) {
    const colorItem = STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === validLikedColor.toLowerCase());
    result.colorHex = validLikedColor;
    result.colorName = colorItem?.name || validLikedColor;
    result.successMessages.push(`Sắc độ tà áo: ${result.colorName}`);
  } else {
    if (profile.likedColors.length === 0) {
      result.noticeMessages.push('Hồ sơ không có màu thích hợp lệ: Giữ nguyên sắc độ đang chọn.');
    } else {
      result.noticeMessages.push(
        'Màu trong hồ sơ trùng với danh sách muốn tránh hoặc chưa có trong bảng màu: Giữ nguyên màu an toàn hiện tại.'
      );
    }
  }

  // 3. Ánh xạ dịp
  const occLower = profile.occasion.toLowerCase();
  if (occLower.includes('kỷ yếu')) {
    result.occasionGoal = 'ky_yeu';
  } else if (occLower.includes('tết') || occLower.includes('lễ')) {
    result.occasionGoal = 'le_tet';
  } else if (occLower.includes('học') || occLower.includes('thuyết trình')) {
    result.occasionGoal = 'thuyet_trinh';
  } else if (occLower.includes('phố') || occLower.includes('chơi') || occLower.includes('cà phê')) {
    result.occasionGoal = 'dao_pho';
  } else if (occLower.includes('cưới') || occLower.includes('trọng đại')) {
    result.occasionGoal = 'cuoi_hoi';
  }

  // 4. Ánh xạ phụ kiện được Studio hỗ trợ
  // A. Khăn đội đầu
  if (profile.culturalBoundaries.some((b) => b.includes('Không đội khăn'))) {
    result.accessoryHead = 'none';
  } else if (profile.accessories.includes('Khăn đóng xếp nếp')) {
    result.accessoryHead = 'khan-dong';
  } else if (profile.accessories.includes('Khăn vấn lụa')) {
    result.accessoryHead = 'khan-van';
  }

  // B. Đồ cầm tay
  if (profile.accessories.includes('Quạt nan lụa thêu')) {
    result.accessoryHand = 'quat-nan';
  } else if (profile.accessories.includes('Túi gấm truyền thống')) {
    result.accessoryHand = 'tui-gam';
  }

  // C. Báo cáo các phụ kiện khác
  const otherAccessories = profile.accessories.filter(
    (a) => !['Khăn đóng xếp nếp', 'Khăn vấn lụa', 'Quạt nan lụa thêu', 'Túi gấm truyền thống'].includes(a)
  );
  if (otherAccessories.length > 0) {
    result.noticeMessages.push(
      `Phụ kiện (${otherAccessories.join(', ')}) đã được lưu vào thông số bối cảnh (mô đun Studio đồ họa tiếp tục cập nhật hiển thị).`
    );
  }

  return result;
}
