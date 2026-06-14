import React from "react";
export default (props) => {
	return (
		<div className="flex flex-col bg-white">
			<div className="self-stretch bg-[#050A14] pb-6">
				<div className="flex justify-between items-center self-stretch bg-[#051424] px-6 mb-[88px]">
					<div className="flex shrink-0 items-center">
						<img
							src={"https://lh3.googleusercontent.com/aida/AP1WRLtveduqtiLF_2grDFfcE8URajrzq-3JOdCqYvuTGOVs4iTjVXLJz2VsT7jREp4mwVjELHa20Q5RVCxMMF1FYka_olvaGepGXImhNOsydicPkHInC9HW6QPD5uqrEO3pwELY1sUJG-CVcShQfXKjd92z-p2EiX_R-AuXtmbaKmnb2dg-t1KBsOhP1ffK3L_12_n4P5H9sF5M7MBhHTRK059I1QbuhsalkrxoNHM8FwetvBmLRTb-Wo6XotIS"} 
							className="w-8 h-8 mr-4 object-fill"
						/>
						<div className="flex flex-col shrink-0 items-start mr-[11px]">
							<span className="text-[#FFB690] text-2xl font-bold mr-[101px]" >
								{"Ocean11"}
							</span>
							<span className="text-[#E0C0B1] text-base" >
								{"Maritime Intelligence"}
							</span>
						</div>
					</div>
					<div className="flex shrink-0 items-center">
						<span className="text-[#E0C0B1] text-base w-[69px] mr-8" >
							{"Live Map"}
						</span>
						<span className="text-[#E0C0B1] text-base w-[107px] mr-8" >
							{"Investigations"}
						</span>
						<span className="text-[#E0C0B1] text-base w-[59px] mr-[31px]" >
							{"Reports"}
						</span>
						<span className="text-[#FFB690] text-base font-bold" >
							{"Alerts"}
						</span>
					</div>
					<div className="flex shrink-0 items-center gap-5">
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/fezrxva4_expires_30_days.png"} 
							className="w-6 h-6 object-fill"
						/>
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/j5xmwo3b_expires_30_days.png"} 
							className="w-6 h-6 object-fill"
						/>
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/9i7mt9bk_expires_30_days.png"} 
							className="w-6 h-6 object-fill"
						/>
						<button className="flex flex-col shrink-0 items-start bg-[#273647] text-left py-[3px] px-[1px] rounded-xl border border-solid border-[#584237]"
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/dc4py1to_expires_30_days.png"} 
								className="w-6 h-6 rounded-xl object-fill"
							/>
						</button>
					</div>
				</div>
				<div className="self-stretch mx-6">
					<div className="flex items-center self-stretch mb-6 gap-4">
						<div className="flex flex-1 flex-col items-start bg-[#0D1B2A] py-[17px] pl-[17px] gap-1 border border-solid border-[#1E3A5F]">
							<span className="text-[#E0C0B1] text-xs font-bold" >
								{"TOTAL ALERTS"}
							</span>
							<span className="text-white text-2xl font-bold" >
								{"07"}
							</span>
						</div>
						<div className="flex flex-1 flex-col items-start bg-[#0D1B2A] py-[17px] pl-5 gap-1 border border-solid border-[#1E3A5F]">
							<span className="text-[#E0C0B1] text-xs font-bold" >
								{"CRITICAL"}
							</span>
							<div className="flex items-center gap-2.5">
								<span className="text-white text-2xl font-bold" >
									{"02"}
								</span>
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/lm79i1tj_expires_30_days.png"} 
									className="w-6 h-6 object-fill"
								/>
							</div>
						</div>
						<div className="flex flex-1 flex-col items-start bg-[#0D1B2A] py-[17px] pl-5 gap-1 border border-solid border-[#1E3A5F]">
							<span className="text-[#E0C0B1] text-xs font-bold" >
								{"HIGH"}
							</span>
							<span className="text-white text-2xl font-bold" >
								{"03"}
							</span>
						</div>
						<div className="flex flex-1 flex-col items-start bg-[#0D1B2A] py-[17px] pl-5 gap-1 border border-solid border-[#1E3A5F]">
							<span className="text-[#E0C0B1] text-xs font-bold" >
								{"MEDIUM"}
							</span>
							<span className="text-white text-2xl font-bold" >
								{"02"}
							</span>
						</div>
					</div>
					<div className="flex justify-between items-center self-stretch mb-6">
						<div className="flex flex-col shrink-0 items-start">
							<span className="text-white text-[32px] font-bold mr-[107px]" >
								{"ACTIVE ALERTS"}
							</span>
							<span className="text-[#E0C0B1] text-sm" >
								{"Real-time anomaly detection across monitored vessels"}
							</span>
						</div>
						<div className="flex shrink-0 items-center gap-[9px]">
							<div className="flex shrink-0 items-center bg-[#122131] py-1 rounded-sm">
								<div className="flex flex-col shrink-0 items-start bg-[#F97316] py-[3px] px-4 ml-1 mr-[21px] rounded-sm">
									<span className="text-[#582200] text-xs font-bold" >
										{"ALL"}
									</span>
								</div>
								<span className="text-[#E0C0B1] text-xs font-bold mr-[39px]" >
									{"CRITICAL"}
								</span>
								<span className="text-[#E0C0B1] text-xs font-bold mr-10" >
									{"HIGH"}
								</span>
								<span className="text-[#E0C0B1] text-xs font-bold mr-[29px]" >
									{"MEDIUM"}
								</span>
							</div>
							<div className="flex shrink-0 items-center py-[9px] rounded-sm border border-solid border-[#1E3A5F]">
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/mc0pdskp_expires_30_days.png"} 
									className="w-3.5 h-3.5 ml-[17px] mr-1 rounded-sm object-fill"
								/>
								<span className="text-[#E0C0B1] text-xs font-bold mr-7" >
									{"MARK ALL READ"}
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-col self-stretch mb-10 gap-2">
						<div className="flex items-center self-stretch bg-[#0D1B2A] py-[17px] px-5 gap-4 border border-solid border-[#1E3A5F]">
							<div className="flex flex-1 flex-col items-start pr-[99px] gap-1">
								<div className="flex items-center">
									<span className="text-white text-base font-bold mr-[22px]" >
										{"MV ESPERANZA"}
									</span>
									<div className="flex flex-col shrink-0 items-start bg-[#010F1F] pb-[1px] px-[9px] mr-2 border border-solid border-[#1E3A5F]">
										<span className="text-[#E0C0B1] text-xs font-bold" >
											{"Bulk Carrier"}
										</span>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<div className="flex flex-col shrink-0 items-start bg-[#EF44441A] py-[1px] px-[5px] border border-solid border-[#EF44444D]">
											<span className="text-red-500 text-[11px]" >
												{"STATIONARY"}
											</span>
										</div>
										<div className="flex flex-col shrink-0 items-start bg-[#EF44441A] py-[1px] px-[5px] border border-solid border-[#EF44444D]">
											<span className="text-red-500 text-[11px]" >
												{"OWNER DISPUTE"}
											</span>
										</div>
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm" >
									{""Vessel stationary for 47 days. Owner Oceanic Holdings Ltd unreachable. Prior ITF incident on record.""}
								</span>
							</div>
							<div className="flex flex-col shrink-0 items-start gap-1">
								<span className="text-[#E0C0B1] text-[13px] ml-[177px]" >
									{"2m ago"}
								</span>
								<div className="flex items-center gap-[15px]">
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"RISK SCORE"}
										</span>
										<span className="text-red-500 text-xl font-bold" >
											{"91/100"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start gap-1">
										<button className="flex items-center bg-[#F97316] text-left py-1 px-4 gap-2.5 rounded-sm border-0"
											onClick={()=>alert("Pressed!")}>
											<span className="text-[#582200] text-xs font-bold" >
												{"INVESTIGATE"}
											</span>
											<img
												src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/ugosj3rz_expires_30_days.png"} 
												className="w-3.5 h-3.5 rounded-sm object-fill"
											/>
										</button>
										<span className="text-[#E0C0B1] text-[11px] mr-[88px]" >
											{"DISMISS"}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center self-stretch bg-[#0D1B2A] py-[17px] px-5 gap-4 border border-solid border-[#1E3A5F]">
							<div className="flex flex-1 flex-col items-start gap-1">
								<div className="flex items-center">
									<span className="text-white text-base font-bold mr-6" >
										{"MV KONSTANTINOS"}
									</span>
									<div className="flex flex-col shrink-0 items-start bg-[#010F1F] pb-[1px] px-[9px] mr-2 border border-solid border-[#1E3A5F]">
										<span className="text-[#E0C0B1] text-xs font-bold" >
											{"Container Ship"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#EF44441A] py-[1px] px-[5px] border border-solid border-[#EF44444D]">
										<span className="text-red-500 text-[11px]" >
											{"CREW COMPLAINT"}
										</span>
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm" >
									{""Formal crew complaint filed with ITF. 62 days wages unpaid. Owner liability disputed.""}
								</span>
							</div>
							<div className="flex flex-col shrink-0 items-start gap-1">
								<span className="text-[#E0C0B1] text-[13px] ml-[177px]" >
									{"8m ago"}
								</span>
								<div className="flex items-center gap-[15px]">
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"RISK SCORE"}
										</span>
										<span className="text-red-500 text-xl font-bold" >
											{"74/100"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start gap-1">
										<button className="flex items-center bg-[#F97316] text-left py-1 px-4 gap-2.5 rounded-sm border-0"
											onClick={()=>alert("Pressed!")}>
											<span className="text-[#582200] text-xs font-bold" >
												{"INVESTIGATE"}
											</span>
											<img
												src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/c1stk4d5_expires_30_days.png"} 
												className="w-3.5 h-3.5 rounded-sm object-fill"
											/>
										</button>
										<span className="text-[#E0C0B1] text-[11px] mr-[88px]" >
											{"DISMISS"}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center self-stretch bg-[#0D1B2A] py-[17px] px-5 gap-4 border border-solid border-[#1E3A5F]">
							<div className="flex flex-1 flex-col items-start gap-1">
								<div className="flex items-center">
									<span className="text-white text-base font-bold mr-[15px]" >
										{"MT HORIZON STAR"}
									</span>
									<div className="flex flex-col shrink-0 items-start bg-[#010F1F] pb-[1px] px-[9px] mr-2 border border-solid border-[#1E3A5F]">
										<span className="text-[#E0C0B1] text-xs font-bold" >
											{"Tanker"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#F973161A] py-[1px] px-[5px] border border-solid border-[#F973164D]">
										<span className="text-[#F97316] text-[11px]" >
											{"AIS DARK"}
										</span>
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm" >
									{""AIS signal lost for 72 hours. Last known position: Red Sea corridor. Conflict zone proximity.""}
								</span>
							</div>
							<div className="flex flex-col shrink-0 items-start gap-1">
								<span className="text-[#E0C0B1] text-[13px] ml-[169px]" >
									{"15m ago"}
								</span>
								<div className="flex items-center gap-[15px]">
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"RISK SCORE"}
										</span>
										<span className="text-[#F97316] text-xl font-bold" >
											{"78/100"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start gap-1">
										<button className="flex items-center bg-[#F97316] text-left py-1 px-4 gap-2.5 rounded-sm border-0"
											onClick={()=>alert("Pressed!")}>
											<span className="text-[#582200] text-xs font-bold" >
												{"INVESTIGATE"}
											</span>
											<img
												src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/ewxgzwxi_expires_30_days.png"} 
												className="w-3.5 h-3.5 rounded-sm object-fill"
											/>
										</button>
										<span className="text-[#E0C0B1] text-[11px] mr-[88px]" >
											{"DISMISS"}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center self-stretch bg-[#0D1B2A] py-[17px] px-5 gap-4 border border-solid border-[#1E3A5F]">
							<div className="flex flex-1 flex-col items-start gap-1">
								<div className="flex items-center">
									<span className="text-white text-base font-bold mr-[23px]" >
										{"MV OCEAN GLORY"}
									</span>
									<div className="flex flex-col shrink-0 items-start bg-[#010F1F] pb-[1px] px-[9px] mr-2 border border-solid border-[#1E3A5F]">
										<span className="text-[#E0C0B1] text-xs font-bold" >
											{"Bulk Carrier"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#F973161A] py-[1px] px-[5px] border border-solid border-[#F973164D]">
										<span className="text-[#F97316] text-[11px]" >
											{"ROUTE ANOMALY"}
										</span>
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm" >
									{""Vessel deviating 340nm from filed route. No updated destination transmitted.""}
								</span>
							</div>
							<div className="flex flex-col shrink-0 items-start gap-1">
								<span className="text-[#E0C0B1] text-[13px] ml-[169px]" >
									{"32m ago"}
								</span>
								<div className="flex items-center gap-[15px]">
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"RISK SCORE"}
										</span>
										<span className="text-[#F97316] text-xl font-bold" >
											{"63/100"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start gap-1">
										<button className="flex items-center bg-[#F97316] text-left py-1 px-4 gap-2.5 rounded-sm border-0"
											onClick={()=>alert("Pressed!")}>
											<span className="text-[#582200] text-xs font-bold" >
												{"INVESTIGATE"}
											</span>
											<img
												src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/jq26p9l6_expires_30_days.png"} 
												className="w-3.5 h-3.5 rounded-sm object-fill"
											/>
										</button>
										<span className="text-[#E0C0B1] text-[11px] mr-[88px]" >
											{"DISMISS"}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center self-stretch bg-[#0D1B2A] py-[17px] px-5 gap-4 border border-solid border-[#1E3A5F]">
							<div className="flex flex-1 flex-col items-start gap-1">
								<div className="flex items-center gap-2">
									<span className="text-white text-base font-bold" >
										{"MT PACIFIC STAR"}
									</span>
									<div className="flex flex-col shrink-0 items-start bg-[#010F1F] pb-[1px] px-[9px] border border-solid border-[#1E3A5F]">
										<span className="text-[#E0C0B1] text-xs font-bold" >
											{"Tanker"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#F973161A] py-[1px] px-[5px] border border-solid border-[#F973164D]">
										<span className="text-[#F97316] text-[11px]" >
											{"STATIONARY"}
										</span>
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm" >
									{""Stationary for 19 days near Strait of Hormuz. No port call scheduled.""}
								</span>
							</div>
							<div className="flex flex-col shrink-0 items-start gap-1">
								<span className="text-[#E0C0B1] text-[13px] ml-[177px]" >
									{"1h ago"}
								</span>
								<div className="flex items-center gap-[15px]">
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"RISK SCORE"}
										</span>
										<span className="text-[#F97316] text-xl font-bold" >
											{"59/100"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start gap-1">
										<button className="flex items-center bg-[#F97316] text-left py-1 px-4 gap-2.5 rounded-sm border-0"
											onClick={()=>alert("Pressed!")}>
											<span className="text-[#582200] text-xs font-bold" >
												{"INVESTIGATE"}
											</span>
											<img
												src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/8keet1q7_expires_30_days.png"} 
												className="w-3.5 h-3.5 rounded-sm object-fill"
											/>
										</button>
										<span className="text-[#E0C0B1] text-[11px] mr-[88px]" >
											{"DISMISS"}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center self-stretch bg-[#0D1B2A] py-[17px] px-5 gap-4 border border-solid border-[#1E3A5F]">
							<div className="flex flex-1 flex-col items-start gap-1">
								<div className="flex items-center">
									<span className="text-white text-base font-bold mr-[13px]" >
										{"MV PACIFIC DAWN"}
									</span>
									<div className="flex flex-col shrink-0 items-start bg-[#010F1F] pb-[1px] px-[9px] mr-2 border border-solid border-[#1E3A5F]">
										<span className="text-[#E0C0B1] text-xs font-bold" >
											{"Container Ship"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#F59E0B1A] py-[1px] px-[5px] border border-solid border-[#F59E0B4D]">
										<span className="text-[#F59E0B] text-[11px]" >
											{"STATIONARY"}
										</span>
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm" >
									{""Stationary 12 days. Owner responsive but ETA unknown.""}
								</span>
							</div>
							<div className="flex flex-col shrink-0 items-start gap-1">
								<span className="text-[#E0C0B1] text-[13px] ml-[177px]" >
									{"2h ago"}
								</span>
								<div className="flex items-center gap-[15px]">
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"RISK SCORE"}
										</span>
										<span className="text-[#F59E0B] text-xl font-bold" >
											{"52/100"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start gap-1">
										<button className="flex items-center bg-[#F97316] text-left py-1 px-4 gap-2.5 rounded-sm border-0"
											onClick={()=>alert("Pressed!")}>
											<span className="text-[#582200] text-xs font-bold" >
												{"INVESTIGATE"}
											</span>
											<img
												src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/1d7u3ioa_expires_30_days.png"} 
												className="w-3.5 h-3.5 rounded-sm object-fill"
											/>
										</button>
										<span className="text-[#E0C0B1] text-[11px] mr-[88px]" >
											{"DISMISS"}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center self-stretch bg-[#0D1B2A] py-[17px] px-5 gap-4 border border-solid border-[#1E3A5F]">
							<div className="flex flex-1 flex-col items-start gap-1">
								<div className="flex items-center">
									<span className="text-white text-base font-bold mr-5" >
										{"MV ARCTIC VOYAGER"}
									</span>
									<div className="flex flex-col shrink-0 items-start bg-[#010F1F] pb-[1px] px-[9px] mr-2 border border-solid border-[#1E3A5F]">
										<span className="text-[#E0C0B1] text-xs font-bold" >
											{"Bulk Carrier"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#F59E0B1A] py-[1px] px-[5px] border border-solid border-[#F59E0B4D]">
										<span className="text-[#F59E0B] text-[11px]" >
											{"ROUTE ANOMALY"}
										</span>
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm" >
									{""Minor route deviation detected. Low confidence anomaly — monitoring.""}
								</span>
							</div>
							<div className="flex flex-col shrink-0 items-start gap-1">
								<span className="text-[#E0C0B1] text-[13px] ml-[177px]" >
									{"4h ago"}
								</span>
								<div className="flex items-center gap-[15px]">
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"RISK SCORE"}
										</span>
										<span className="text-[#F59E0B] text-xl font-bold" >
											{"38/100"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start gap-1">
										<button className="flex items-center bg-[#F97316] text-left py-1 px-4 gap-2.5 rounded-sm border-0"
											onClick={()=>alert("Pressed!")}>
											<span className="text-[#582200] text-xs font-bold" >
												{"INVESTIGATE"}
											</span>
											<img
												src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/pkow1l44_expires_30_days.png"} 
												className="w-3.5 h-3.5 rounded-sm object-fill"
											/>
										</button>
										<span className="text-[#E0C0B1] text-[11px] mr-[88px]" >
											{"DISMISS"}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="flex flex-col items-start self-stretch gap-4">
						<span className="text-[#E0C0B1] text-xs font-bold" >
							{"RECENT DISMISSALS"}
						</span>
						<div className="flex flex-col self-stretch gap-1">
							<div className="flex justify-between items-center self-stretch bg-[#0D1B2A] py-[9px] px-[17px] border border-solid border-[#1E3A5F]">
								<div className="flex shrink-0 items-center gap-7">
									<span className="text-white text-xs font-bold" >
										{"MV SEAFARER"}
									</span>
									<span className="text-[#E0C0B1] text-xs" >
										{"False Positive - AIS Jitter"}
									</span>
								</div>
								<span className="text-[#F97316] text-[11px]" >
									{"Restore"}
								</span>
							</div>
							<div className="flex justify-between items-center self-stretch bg-[#0D1B2A] py-[9px] px-[17px] border border-solid border-[#1E3A5F]">
								<div className="flex shrink-0 items-center gap-[27px]">
									<span className="text-white text-xs font-bold" >
										{"MT CRIMSON TIDE"}
									</span>
									<span className="text-[#E0C0B1] text-xs" >
										{"Maintenance Stop Confirmed"}
									</span>
								</div>
								<span className="text-[#F97316] text-[11px]" >
									{"Restore"}
								</span>
							</div>
							<div className="flex justify-between items-center self-stretch bg-[#0D1B2A] py-[9px] px-[17px] border border-solid border-[#1E3A5F]">
								<div className="flex shrink-0 items-center gap-[33px]">
									<span className="text-white text-xs font-bold" >
										{"MV NORTHERN LIGHT"}
									</span>
									<span className="text-[#E0C0B1] text-xs" >
										{"Route Update Received"}
									</span>
								</div>
								<span className="text-[#F97316] text-[11px]" >
									{"Restore"}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}