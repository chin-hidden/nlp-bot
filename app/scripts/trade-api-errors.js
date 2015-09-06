
var messages = [
	{code: 'CONNECTION', message: 'Không thể kết nối, xin vui lòng kiểm tra lại đường truyền và thử lại. Nếu quý khách vẫn gặp vấn đề, xin vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'AUTH-01', message: 'Quý khách cần đăng nhập để sử dụng chức năng này.'},
	{code: 'AUTH-02', message: 'Tên đăng nhập hoặc mật khẩu quý khách vừa nhập chưa đúng, xin vui lòng thử lại.'},
	{code: 'AUTH-03', message: 'Token đăng nhập không hợp lệ. Xin đóng cửa sổ và thử lại.'},
	{code: 'AUTH-04', message: 'Phiên đăng nhập của quý khách đã kết thúc, xin vui lòng đăng nhập lại.'},
	{code: 'AUTH-05', message: 'Quý khách cần xác nhận thẻ VTOS để sử dụng chức năng này.'},
	{code: 'AUTH-06', message: 'Mã VTOS quý khách vừa điền chưa đúng, xin vui lòng thử lại.'},
	{code: 'AUTH-07', message: 'Thẻ VTOS của quý khách đã bị khóa. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để mở lại thẻ.'},
	{code: 'AUTH-08', message: 'Thẻ VTOS của quý khách chưa được kích hoạt. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'AUTH-09', message: 'Thẻ VTOS của quý khách đã hết hạn. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'AUTH-10', message: 'Có lỗi xảy ra với thẻ VTOS của quý khách. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'AUTH-11', message: 'Có lỗi xảy ra với quá trình xác nhận VTOS. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'AUTH-99', message: 'Có lỗi xảy ra với quá trình xác nhận VTOS. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'UNKNOWN', message: 'Hệ thống vừa gặp lỗi, xin vui lòng thử lại. Nếu quý khách vẫn gặp vấn đề, xin gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'SERVICE-01', message: 'Hệ thống vừa gặp lỗi, xin vui lòng thử lại. Nếu quý khách vẫn gặp vấn đề, xin gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'SERVICE-02', message: 'Yêu cầu của quý khách không thực hiện được do hệ thống đang trong phiên xử lý dữ liệu hàng ngày. Xin vui lòng thử lại sau.'},
	{code: 'SERVICE-03', message: 'Giá không hợp lệ, xin vui lòng thử lại.'},
	{code: 'ORDER-0', message: 'Đặt lệnh không thành công. Xin vui lòng thử lại.'},
	{code: 'ORDER-01', message: 'Loại giá quý khách chọn không hợp lệ trong phiên này. Xin vui lòng thử lại.'},
	{code: 'ORDER-02', message: 'Lệnh đặt bị trùng. Xin vui lòng thử lại.'},
	{code: 'ORDER-03', message: 'Loại giá không tồn tại. Xin vui lòng thử lại.'},
	{code: 'ORDER-04', message: 'Không đủ sức mua. Xin vui lòng thử lại.'},
	{code: 'ORDER-05', message: 'Khối lượng lệnh không hợp lệ. Xin vui lòng thử lại.'},
	{code: 'ORDER-06', message: 'Mã chứng khoán không tồn tại. Xin vui lòng thử lại.'},
	{code: 'ORDER-07', message: 'Tài khoản không hợp lệ. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'ORDER-08', message: 'Tài khoản của quý khách không thể giao dịch mã chứng khoán này.'},
	{code: 'ORDER-10', message: 'Không đủ room. Xin vui lòng thử lại.'},
	{code: 'ORDER-14', message: 'Giá trị lệnh đặt vượt quá hạn mức giao dịch. Xin vui lòng thử lại.'},
	{code: 'ORDER-15', message: 'Không đủ tiền trong tài khoản. Xin vui lòng thử lại.'},
	{code: 'ORDER-16', message: 'Khối lượng đặt vượt quá khối lượng có trong tài khoản. Xin vui lòng thử lại.'},
	{code: 'ORDER-17', message: 'Không thể mua bán cùng mã chứng khoán trong ngày. Xin vui lòng thử lại.'},
	{code: 'ORDER-18', message: 'Sai bước giá. Xin vui lòng thử lại.'},
	{code: 'ORDER-19', message: 'Sai lô giao dịch. Xin vui lòng thử lại.'},
	{code: 'ORDER-20', message: 'Không tìm thấy loại lênh. Xin vui lòng thử lại.'},
	{code: 'ORDER-21', message: 'Thị trường đã đóng cửa. Xin thử lại vào phiên giao dịch tới.'},
	{code: 'ORDER-22', message: 'Chứng khoán bị tạm dừng giao dịch. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'ORDER-23', message: 'Chứng khoán đang bị treo, không được giao dịch. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'ORDER-24', message: 'Thị trường đang tạm ngừng giao dịch. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.'},
	{code: 'ORDER-26', message: 'Giá không nằm trong biên độ trần sàn. Xin vui lòng thử lại.'},
	{code: 'ORDER-27', message: 'Không đủ pool. Xin vui lòng thử lại.'},
	{code: 'ORDER-28', message: 'Xin lỗi, đã hết giờ giao dịch. quý khách có thể đặt lệnh trở lại từ 20h00, sau khi hệ thống hoàn thành xử lý dữ liệu trong ngày.'},
	{code: 'CANCEL-01', message: 'Không thể hủy lệnh trong 5 phút cuối phiên ATC.'},
	{code: 'CANCEL-02', message: 'Không thể huỷ lệnh bán xử lý.'},
	{code: 'CANCEL-03', message: 'Yêu cầu sửa đã được huỷ từ trước.'},
	{code: 'AMEND-01', message: 'Không thể sửa lệnh trong 5 phút cuối phiên ATC.'},
	{code: 'AMEND-02', message: 'Không thể sửa lệnh với mã sàn HOSE.'},
	{code: 'AMEND-03', message: 'Không thể sửa lệnh bán xử lý.'},
	{code: 'AMEND-04', message: 'Không thể sửa loại lệnh này.'},
	{code: 'AMEND-05', message: 'Giá sửa không hợp lệ. Xin vui lòng thử lại.'},
	{code: 'AMEND-06', message: 'Khối lượng còn lại không đủ. Xin vui lòng thử lại.'},
	{code: 'AMEND-07', message: 'Khối lượng sửa cần phải lớn hơn khối lượng đã khớp. Xin vui lòng thử lại.'},
	{code: 'AMEND-08', message: 'Không thể sửa lệnh. Lệnh đã khớp hết.'}
];

var parseNonServerErrors = function(jqXHR) {
	if (typeof jqXHR.responseJSON == 'undefined') {
		jqXHR.responseJSON = { error: 'CONNECTION' };
	}
	return jqXHR;
};


module.exports = {
	getMessage: function(jqXHR) {
		jqXHR = parseNonServerErrors(jqXHR);
		for (var i = 0; i < messages.length; i++) {
			if (messages[i].code === jqXHR.responseJSON.error) {
				return messages[i].message;
			}
		}
		return 'Có lỗi xảy ra, xin vui lòng thử lại.';
	},

	getCode: function(jqXHR) {
		jqXHR = parseNonServerErrors(jqXHR);
		return jqXHR.responseJSON.error;
	}
}
